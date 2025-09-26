// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChildRecord {
    struct Record {
        uint id;
        string name;
        uint age;
        string healthStatus;
        string guardian;
        uint timestamp;
    }

    mapping(uint => Record) public records;
    uint public recordCount;

    function addRecord(
        string memory _name,
        uint _age,
        string memory _healthStatus,
        string memory _guardian
    ) public {
        recordCount++;
        records[recordCount] = Record(recordCount, _name, _age, _healthStatus, _guardian, block.timestamp);
    }

    function getRecord(uint _id) public view returns (Record memory) {
        return records[_id];
    }
}
