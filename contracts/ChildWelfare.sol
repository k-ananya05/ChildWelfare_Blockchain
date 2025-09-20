// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ChildWelfare is AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant NGO_ROLE = keccak256("NGO_ROLE");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Child record structure with comprehensive data
    struct ChildRecord {
        uint256 id;
        string name;
        uint256 age;
        string healthStatus;
        string location;
        string guardian;
        string status; // in_care, adopted, transferred, etc.
        uint256 createdAt;
        uint256 lastUpdatedAt;
        address createdBy;
        address lastUpdatedBy;
        bool isActive;
        string metadata; // JSON string for additional data
    }

    // Transfer/Update history for audit trail
    struct RecordHistory {
        uint256 recordId;
        string action; // create, update, transfer, deactivate
        address actor;
        string oldValue;
        string newValue;
        uint256 timestamp;
        string reason;
    }

    // State variables
    mapping(uint256 => ChildRecord) public records;
    mapping(uint256 => RecordHistory[]) public recordHistory;
    mapping(address => bool) public authorizedEntities;
    mapping(uint256 => bool) public recordExists;
    
    uint256 public recordCount;
    uint256 public historyCount;
    
    // Events for state changes
    event RecordCreated(uint256 indexed recordId, address indexed creator, string name);
    event RecordUpdated(uint256 indexed recordId, address indexed updater, string field, string oldValue, string newValue);
    event RecordTransferred(uint256 indexed recordId, address indexed from, address indexed to, string newGuardian);
    event RecordDeactivated(uint256 indexed recordId, address indexed deactivator, string reason);
    event EntityAuthorized(address indexed entity, bytes32 role);
    event EntityDeauthorized(address indexed entity, bytes32 role);

    // Modifiers for access control
    modifier onlyAuthorized() {
        require(
            hasRole(NGO_ROLE, msg.sender) || 
            hasRole(GOVERNMENT_ROLE, msg.sender) || 
            hasRole(HOSPITAL_ROLE, msg.sender) || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized access"
        );
        _;
    }

    modifier onlyNGO() {
        require(hasRole(NGO_ROLE, msg.sender), "Only NGOs can perform this action");
        _;
    }

    modifier onlyGovernment() {
        require(hasRole(GOVERNMENT_ROLE, msg.sender), "Only Government can perform this action");
        _;
    }

    modifier onlyHospital() {
        require(hasRole(HOSPITAL_ROLE, msg.sender), "Only Hospitals can perform this action");
        _;
    }

    modifier recordMustExist(uint256 _recordId) {
        require(recordExists[_recordId], "Record does not exist");
        _;
    }

    modifier recordMustBeActive(uint256 _recordId) {
        require(records[_recordId].isActive, "Record is not active");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Atomic record creation with verification
    function createRecord(
        string memory _name,
        uint256 _age,
        string memory _healthStatus,
        string memory _location,
        string memory _guardian,
        string memory _metadata
    ) external onlyNGO whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0 && _age <= 18, "Invalid age");
        require(bytes(_healthStatus).length > 0, "Health status required");
        require(bytes(_location).length > 0, "Location required");
        require(bytes(_guardian).length > 0, "Guardian required");

        recordCount++;
        uint256 newRecordId = recordCount;

        // Atomic state update
        records[newRecordId] = ChildRecord({
            id: newRecordId,
            name: _name,
            age: _age,
            healthStatus: _healthStatus,
            location: _location,
            guardian: _guardian,
            status: "in_care",
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            createdBy: msg.sender,
            lastUpdatedBy: msg.sender,
            isActive: true,
            metadata: _metadata
        });

        recordExists[newRecordId] = true;

        // Add to history
        _addHistory(newRecordId, "create", msg.sender, "", _name, "Record created");

        emit RecordCreated(newRecordId, msg.sender, _name);
        return newRecordId;
    }

    // Atomic record update with verification
    function updateRecord(
        uint256 _recordId,
        string memory _field,
        string memory _newValue,
        string memory _reason
    ) external onlyAuthorized recordMustExist(_recordId) recordMustBeActive(_recordId) whenNotPaused nonReentrant {
        require(bytes(_field).length > 0, "Field name required");
        require(bytes(_newValue).length > 0, "New value required");
        require(bytes(_reason).length > 0, "Reason required");

        ChildRecord storage record = records[_recordId];
        string memory oldValue = "";

        // Atomic field updates with verification
        if (keccak256(bytes(_field)) == keccak256(bytes("name"))) {
            require(hasRole(NGO_ROLE, msg.sender) || hasRole(GOVERNMENT_ROLE, msg.sender), "Insufficient permissions for name update");
            oldValue = record.name;
            record.name = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("age"))) {
            require(hasRole(NGO_ROLE, msg.sender) || hasRole(GOVERNMENT_ROLE, msg.sender), "Insufficient permissions for age update");
            uint256 newAge = _parseUint(_newValue);
            require(newAge > 0 && newAge <= 18, "Invalid age");
            oldValue = _uintToString(record.age);
            record.age = newAge;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("healthStatus"))) {
            require(hasRole(HOSPITAL_ROLE, msg.sender) || hasRole(NGO_ROLE, msg.sender), "Insufficient permissions for health update");
            oldValue = record.healthStatus;
            record.healthStatus = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("location"))) {
            require(hasRole(NGO_ROLE, msg.sender) || hasRole(GOVERNMENT_ROLE, msg.sender), "Insufficient permissions for location update");
            oldValue = record.location;
            record.location = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("status"))) {
            require(hasRole(NGO_ROLE, msg.sender) || hasRole(GOVERNMENT_ROLE, msg.sender), "Insufficient permissions for status update");
            oldValue = record.status;
            record.status = _newValue;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("metadata"))) {
            oldValue = record.metadata;
            record.metadata = _newValue;
        } else {
            revert("Invalid field for update");
        }

        // Update record metadata
        record.lastUpdatedAt = block.timestamp;
        record.lastUpdatedBy = msg.sender;

        // Add to history
        _addHistory(_recordId, "update", msg.sender, oldValue, _newValue, _reason);

        emit RecordUpdated(_recordId, msg.sender, _field, oldValue, _newValue);
    }

    // Atomic guardianship transfer with verification
    function transferGuardianship(
        uint256 _recordId,
        string memory _newGuardian,
        string memory _reason
    ) external onlyGovernment recordMustExist(_recordId) recordMustBeActive(_recordId) whenNotPaused nonReentrant {
        require(bytes(_newGuardian).length > 0, "New guardian required");
        require(bytes(_reason).length > 0, "Transfer reason required");

        ChildRecord storage record = records[_recordId];
        string memory oldGuardian = record.guardian;
        
        // Atomic transfer
        record.guardian = _newGuardian;
        record.lastUpdatedAt = block.timestamp;
        record.lastUpdatedBy = msg.sender;

        // Add to history
        _addHistory(_recordId, "transfer", msg.sender, oldGuardian, _newGuardian, _reason);

        emit RecordTransferred(_recordId, record.createdBy, msg.sender, _newGuardian);
    }

    // Atomic record deactivation with verification
    function deactivateRecord(
        uint256 _recordId,
        string memory _reason
    ) external onlyGovernment recordMustExist(_recordId) recordMustBeActive(_recordId) whenNotPaused nonReentrant {
        require(bytes(_reason).length > 0, "Deactivation reason required");

        ChildRecord storage record = records[_recordId];
        
        // Atomic deactivation
        record.isActive = false;
        record.status = "deactivated";
        record.lastUpdatedAt = block.timestamp;
        record.lastUpdatedBy = msg.sender;

        // Add to history
        _addHistory(_recordId, "deactivate", msg.sender, "active", "inactive", _reason);

        emit RecordDeactivated(_recordId, msg.sender, _reason);
    }

    // Role management functions
    function grantRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.grantRole(role, account);
        authorizedEntities[account] = true;
        emit EntityAuthorized(account, role);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        super.revokeRole(role, account);
        if (!hasAnyRole(account)) {
            authorizedEntities[account] = false;
        }
        emit EntityDeauthorized(account, role);
    }

    // View functions
    function getRecord(uint256 _recordId) external view recordMustExist(_recordId) returns (ChildRecord memory) {
        return records[_recordId];
    }

    function getRecordHistory(uint256 _recordId) external view recordMustExist(_recordId) returns (RecordHistory[] memory) {
        return recordHistory[_recordId];
    }

    function getAllRecords() external view returns (ChildRecord[] memory) {
        ChildRecord[] memory allRecords = new ChildRecord[](recordCount);
        for (uint256 i = 1; i <= recordCount; i++) {
            if (recordExists[i]) {
                allRecords[i - 1] = records[i];
            }
        }
        return allRecords;
    }

    function getActiveRecords() external view returns (ChildRecord[] memory) {
        uint256 activeCount = 0;
        
        // Count active records
        for (uint256 i = 1; i <= recordCount; i++) {
            if (recordExists[i] && records[i].isActive) {
                activeCount++;
            }
        }

        // Create array and populate
        ChildRecord[] memory activeRecords = new ChildRecord[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= recordCount; i++) {
            if (recordExists[i] && records[i].isActive) {
                activeRecords[index] = records[i];
                index++;
            }
        }
        
        return activeRecords;
    }

    function getRecordsByCreator(address _creator) external view returns (ChildRecord[] memory) {
        uint256 count = 0;
        
        // Count records by creator
        for (uint256 i = 1; i <= recordCount; i++) {
            if (recordExists[i] && records[i].createdBy == _creator) {
                count++;
            }
        }

        // Create array and populate
        ChildRecord[] memory creatorRecords = new ChildRecord[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= recordCount; i++) {
            if (recordExists[i] && records[i].createdBy == _creator) {
                creatorRecords[index] = records[i];
                index++;
            }
        }
        
        return creatorRecords;
    }

    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Internal helper functions
    function _addHistory(
        uint256 _recordId,
        string memory _action,
        address _actor,
        string memory _oldValue,
        string memory _newValue,
        string memory _reason
    ) internal {
        historyCount++;
        recordHistory[_recordId].push(RecordHistory({
            recordId: _recordId,
            action: _action,
            actor: _actor,
            oldValue: _oldValue,
            newValue: _newValue,
            timestamp: block.timestamp,
            reason: _reason
        }));
    }

    function _parseUint(string memory _str) internal pure returns (uint256) {
        bytes memory b = bytes(_str);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {
                result = result * 10 + (uint8(b[i]) - 48);
            } else {
                revert("Invalid number format");
            }
        }
        return result;
    }

    function _uintToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }

    function hasAnyRole(address account) internal view returns (bool) {
        return hasRole(NGO_ROLE, account) || 
               hasRole(GOVERNMENT_ROLE, account) || 
               hasRole(HOSPITAL_ROLE, account) || 
               hasRole(AUDITOR_ROLE, account) || 
               hasRole(ADMIN_ROLE, account);
    }
}
