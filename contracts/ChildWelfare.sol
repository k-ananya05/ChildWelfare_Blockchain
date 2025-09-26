// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChildWelfare {
    enum Role { NGO, Hospital, Government, Auditor }

    struct ChildRecord {
        uint256 id;
        string name;
        uint256 age;
        string healthStatus;
        string location;
        string guardian;
        string status;
        uint256 createdAt;
        uint256 lastUpdatedAt;
        address createdBy;
        address lastUpdatedBy;
        bool isActive;
        string metadata;
    }

    ChildRecord[] public records;
    uint256 public recordCount;
    mapping(address => Role) public roles;

    event RecordCreated(uint256 indexed recordId, address indexed createdBy, string name);

    modifier onlyNGO() {
        require(roles[msg.sender] == Role.NGO, "Only NGO can perform this action");
        _;
    }

    modifier onlyHospital() {
        require(roles[msg.sender] == Role.Hospital, "Only Hospital can perform this action");
        _;
    }

    modifier onlyGovernment() {
        require(roles[msg.sender] == Role.Government, "Only Government can perform this action");
        _;
    }

    modifier onlyAuditor() {
        require(roles[msg.sender] == Role.Auditor, "Only Auditor can perform this action");
        _;
    }

    modifier onlyAnyRole() {
        Role userRole = roles[msg.sender];
        require(userRole == Role.NGO || userRole == Role.Hospital || userRole == Role.Government || userRole == Role.Auditor, "Access denied: invalid role");
        _;
    }

    function setRole(address _user, Role _role) public {
        roles[_user] = _role;
    }

    function createRecord(
        string memory _name,
        uint256 _age,
        string memory _healthStatus,
        string memory _location,
        string memory _guardian,
        string memory _metadata
    ) public onlyNGO returns (uint256) {
        require(_age <= 18, "Age must be 18 or younger");

        ChildRecord memory newRecord = ChildRecord({
            id: recordCount,
            name: _name,
            age: _age,
            healthStatus: _healthStatus,
            location: _location,
            guardian: _guardian,
            status: "Active",
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            createdBy: msg.sender,
            lastUpdatedBy: msg.sender,
            isActive: true,
            metadata: _metadata
        });

        records.push(newRecord);
        recordCount++;

        emit RecordCreated(recordCount - 1, msg.sender, _name);

        return recordCount - 1;
    }

    function updateRecord(
        uint256 _recordId,
        string memory _field,
        string memory _newValue,
        string memory _reason
    ) public {
        require(_recordId < recordCount, "Record does not exist");
        require(records[_recordId].isActive, "Record is inactive");

        if (keccak256(bytes(_field)) == keccak256(bytes("healthStatus"))) {
            require(roles[msg.sender] == Role.Hospital, "Only Hospital can update health status");
        } else {
            require(roles[msg.sender] == Role.NGO, "Only NGO can update records");
        }

        if (keccak256(bytes(_field)) == keccak256(bytes("name"))) {
            records[_recordId].name = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("healthStatus"))) {
            records[_recordId].healthStatus = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("location"))) {
            records[_recordId].location = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("guardian"))) {
            records[_recordId].guardian = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("metadata"))) {
            records[_recordId].metadata = _newValue;
        } else {
            revert("Invalid field");
        }

        records[_recordId].status = _reason;
        records[_recordId].lastUpdatedAt = block.timestamp;
        records[_recordId].lastUpdatedBy = msg.sender;
    }

    function transferGuardianship(
        uint256 _recordId,
        string memory _newGuardian,
        string memory _reason
    ) public onlyGovernment {
        require(_recordId < recordCount, "Record does not exist");
        require(records[_recordId].isActive, "Record is inactive");

        records[_recordId].guardian = _newGuardian;
        records[_recordId].status = _reason;
        records[_recordId].lastUpdatedAt = block.timestamp;
        records[_recordId].lastUpdatedBy = msg.sender;
    }

    function deactivateRecord(uint256 _recordId, string memory _reason) public onlyNGO {
        require(_recordId < recordCount, "Record does not exist");

        records[_recordId].isActive = false;
        records[_recordId].status = _reason;
        records[_recordId].lastUpdatedAt = block.timestamp;
        records[_recordId].lastUpdatedBy = msg.sender;
    }

    function getRecord(uint256 _recordId) public view onlyAnyRole returns (ChildRecord memory) {
        require(_recordId < recordCount, "Record does not exist");
        return records[_recordId];
    }

    function getAllRecords() public view onlyAnyRole returns (ChildRecord[] memory) {
        return records;
    }

    function getActiveRecords() public view onlyAnyRole returns (ChildRecord[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < recordCount; i++) {
            if (records[i].isActive) {
                activeCount++;
            }
        }

        ChildRecord[] memory activeRecords = new ChildRecord[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < recordCount; i++) {
            if (records[i].isActive) {
                activeRecords[index] = records[i];
                index++;
            }
        }
        return activeRecords;
    }
}
