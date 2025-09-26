// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChildWelfare {
    struct Case {
        string caseId;
        string status;
        address creator;
        uint256 createdAt;
        string[] records;
        string[] flags;
        mapping(address => bool) accessControl;
    }
    
    mapping(string => Case) public cases;
    mapping(address => string) public roles; // address -> role
    
    event CaseOpened(string indexed caseId, address indexed creator);
    event RecordAdded(string indexed caseId, string recordType, string ipfsHash);
    event CaseValidated(string indexed caseId, string decision, address validator);
    event CaseClosed(string indexed caseId, address closer);
    event CaseFlagged(string indexed caseId, string reason, address flagger);
    event RoleGranted(address indexed user, string role);
    event RoleRevoked(address indexed user, string role);
    
    modifier onlyRole(string memory requiredRole) {
        require(keccak256(bytes(roles[msg.sender])) == keccak256(bytes(requiredRole)), "Insufficient role");
        _;
    }
    
    modifier onlyCaseParticipant(string memory caseId) {
        require(cases[caseId].accessControl[msg.sender] || cases[caseId].creator == msg.sender, "Not authorized for this case");
        _;
    }
    
    constructor() {
        // Deployer is admin by default
        roles[msg.sender] = "Admin";
    }
    
    function grantRole(address user, string memory role) external onlyRole("Admin") {
        roles[user] = role;
        emit RoleGranted(user, role);
    }
    
    function revokeRole(address user) external onlyRole("Admin") {
        delete roles[user];
        emit RoleRevoked(user, "");
    }
    
    function openCase(string memory caseId) external onlyRole("NGO") {
        require(cases[caseId].creator == address(0), "Case already exists");
        
        Case storage newCase = cases[caseId];
        newCase.caseId = caseId;
        newCase.status = "OPEN";
        newCase.creator = msg.sender;
        newCase.createdAt = block.timestamp;
        newCase.accessControl[msg.sender] = true;
        
        emit CaseOpened(caseId, msg.sender);
    }
    
    function addWelfareRecord(string memory caseId, string memory ipfsHash) 
        external 
        onlyRole("NGO") 
        onlyCaseParticipant(caseId) 
    {
        cases[caseId].records.push(ipfsHash);
        emit RecordAdded(caseId, "welfare", ipfsHash);
    }
    
    function addMedicalRecord(string memory caseId, string memory ipfsHash) 
        external 
        onlyRole("Hospital") 
        onlyCaseParticipant(caseId) 
    {
        cases[caseId].records.push(ipfsHash);
        emit RecordAdded(caseId, "medical", ipfsHash);
    }
    
    function validateCase(string memory caseId, string memory decision) 
        external 
        onlyRole("Government") 
        onlyCaseParticipant(caseId) 
    {
        require(keccak256(bytes(decision)) == keccak256(bytes("APPROVE")) || 
                keccak256(bytes(decision)) == keccak256(bytes("REJECT")), "Invalid decision");
        
        cases[caseId].status = decision;
        emit CaseValidated(caseId, decision, msg.sender);
    }
    
    function closeCase(string memory caseId) 
        external 
        onlyRole("Government") 
        onlyCaseParticipant(caseId) 
    {
        cases[caseId].status = "CLOSED";
        emit CaseClosed(caseId, msg.sender);
    }
    
    function flagCase(string memory caseId, string memory reason) 
        external 
        onlyRole("Government") 
        onlyRole("Auditor") 
        onlyCaseParticipant(caseId) 
    {
        cases[caseId].flags.push(reason);
        emit CaseFlagged(caseId, reason, msg.sender);
    }
    
    function freezeCase(string memory caseId) external onlyRole("Admin") {
        cases[caseId].status = "FROZEN";
    }
    
    function unfreezeCase(string memory caseId) external onlyRole("Admin") {
        cases[caseId].status = "OPEN";
    }
    
    function grantCaseAccess(string memory caseId, address user) external onlyRole("Admin") {
        cases[caseId].accessControl[user] = true;
    }
    
    function revokeCaseAccess(string memory caseId, address user) external onlyRole("Admin") {
        cases[caseId].accessControl[user] = false;
    }
    
    function getCase(string memory caseId) external view returns (
        string memory status,
        address creator,
        uint256 createdAt,
        uint256 recordCount,
        uint256 flagCount
    ) {
        Case storage c = cases[caseId];
        return (c.status, c.creator, c.createdAt, c.records.length, c.flags.length);
    }
}