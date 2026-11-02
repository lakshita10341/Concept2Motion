import { ModalExecutor } from "../../providers/modal/ModalExecutor.js";
export class SimulationAgent {
    executor;
    llm;
    constructor(executor, llm) {
        this.executor = executor || new ModalExecutor();
        this.llm = llm;
    }
    async runSimulation(topic, algorithmParams) {
        const t = topic.toLowerCase();
        const isBinarySearch = t.includes("binary search");
        const isBloomFilter = t.includes("bloom");
        const isTree = t.includes("b-tree") || t.includes("tree");
        let pythonScript = "";
        const target = algorithmParams?.target ?? 42;
        const array = algorithmParams?.array ?? [7, 14, 21, 28, 35, 42, 49, 56, 63];
        const isConsensus = t.includes("raft") || t.includes("consensus") || t.includes("paxos");
        const isDNS = t.includes("dns") || t.includes("domain name");
        const isCache = t.includes("cache") || t.includes("lru") || t.includes("redis");
        if (isConsensus) {
            pythonScript = `
import json

def raft_simulation():
    # 5-node cluster simulation
    cluster = ["Node_A", "Node_B", "Node_C", "Node_D", "Node_E"]
    states = [
        {
            "step": 1,
            "description": "Cluster initializes in Follower state with randomized election timeouts (150-300ms)",
            "stateData": {
                "term": 1,
                "leader": None,
                "nodes": [{"id": n, "role": "Follower", "votes": 0, "logLen": 0} for n in cluster],
                "action": "ELECTION_TIMEOUT",
                "quorum": 3
            }
        },
        {
            "step": 2,
            "description": "Node A election timer expires -> increments Term to 2, transitions to Candidate, requests votes",
            "stateData": {
                "term": 2,
                "leader": None,
                "candidate": "Node_A",
                "nodes": [
                    {"id": "Node_A", "role": "Candidate", "votes": 3, "logLen": 0},
                    {"id": "Node_B", "role": "Follower", "votedFor": "Node_A", "logLen": 0},
                    {"id": "Node_C", "role": "Follower", "votedFor": "Node_A", "logLen": 0},
                    {"id": "Node_D", "role": "Follower", "votedFor": None, "logLen": 0},
                    {"id": "Node_E", "role": "Follower", "votedFor": None, "logLen": 0}
                ],
                "action": "VOTE_QUORUM_RECEIVED",
                "quorum": 3
            }
        },
        {
            "step": 3,
            "description": "Node A receives majority quorum (3/5 votes) -> Elected Leader for Term 2, sends heartbeats",
            "stateData": {
                "term": 2,
                "leader": "Node_A",
                "nodes": [
                    {"id": "Node_A", "role": "Leader", "votes": 3, "logLen": 1},
                    {"id": "Node_B", "role": "Follower", "logLen": 1},
                    {"id": "Node_C", "role": "Follower", "logLen": 1},
                    {"id": "Node_D", "role": "Follower", "logLen": 0},
                    {"id": "Node_E", "role": "Follower", "logLen": 0}
                ],
                "action": "LOG_REPLICATION",
                "logEntry": {"index": 1, "term": 2, "command": "SET x=42"}
            }
        },
        {
            "step": 4,
            "description": "Leader replicates entry to majority (Nodes B & C) -> Commits entry, applies to state machine",
            "stateData": {
                "term": 2,
                "leader": "Node_A",
                "nodes": [
                    {"id": "Node_A", "role": "Leader", "committedIndex": 1},
                    {"id": "Node_B", "role": "Follower", "committedIndex": 1},
                    {"id": "Node_C", "role": "Follower", "committedIndex": 1},
                    {"id": "Node_D", "role": "Follower", "committedIndex": 0},
                    {"id": "Node_E", "role": "Follower", "committedIndex": 0}
                ],
                "action": "COMMITTED_MAJORITY",
                "consensusReached": True
            }
        }
    ]
    return states

if __name__ == "__main__":
    print("---OUTPUT_START---")
    print(json.dumps(raft_simulation()))
    print("---OUTPUT_END---")
`;
            const res = await this.executor.execute(pythonScript, array, target);
            return { ...res, algorithm: "Raft Consensus" };
        }
        else if (isDNS) {
            pythonScript = `
import json

def dns_simulation():
    return [
        {"step": 1, "description": "Browser queries Local DNS Resolver (Cache Miss for example.com)", "stateData": {"level": "Browser -> Resolver", "query": "example.com", "status": "cache_miss"}},
        {"step": 2, "description": "Resolver queries Root Nameserver ('.') -> returns .com TLD Server IP", "stateData": {"level": "Root Server", "referral": "com.tld"}},
        {"step": 3, "description": "Resolver queries TLD Server ('.com') -> returns Authoritative NS for example.com", "stateData": {"level": "TLD Nameserver", "authoritativeNS": "ns1.example.com"}},
        {"step": 4, "description": "Authoritative Nameserver returns IP 93.184.216.34 -> Resolver caches & returns to Client", "stateData": {"level": "Authoritative NS", "ip": "93.184.216.34", "ttl": 300, "resolved": True}}
    ]

if __name__ == "__main__":
    print("---OUTPUT_START---")
    print(json.dumps(dns_simulation()))
    print("---OUTPUT_END---")
`;
            const res = await this.executor.execute(pythonScript, array, target);
            return { ...res, algorithm: "DNS Resolution" };
        }
        else if (isBloomFilter) {
            pythonScript = `
import json
import hashlib

def hash1(s, m):
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % m

def hash2(s, m):
    return int(hashlib.sha256(s.encode()).hexdigest(), 16) % m

def hash3(s, m):
    return int(hashlib.sha1(s.encode()).hexdigest(), 16) % m

def bloom_filter_simulation():
    m = 10
    bit_array = [0] * m
    items_to_add = ["apple", "banana"]
    test_queries = ["apple", "cherry"]
    states = []
    step = 1

    states.append({
        "step": step,
        "description": "Initialize Bloom Filter bit array of size 10 with all 0s",
        "stateData": {
            "array": bit_array.copy(),
            "m": m,
            "currentItem": None,
            "hashIndices": [],
            "action": "init"
        }
    })

    for item in items_to_add:
        step += 1
        h1, h2, h3 = hash1(item, m), hash2(item, m), hash3(item, m)
        indices = sorted(list(set([h1, h2, h3])))
        for idx in indices:
            bit_array[idx] = 1
        states.append({
            "step": step,
            "description": f"Insert '{item}': hashes map to bit indices {indices}. Set bits to 1.",
            "stateData": {
                "array": bit_array.copy(),
                "m": m,
                "currentItem": item,
                "hashIndices": indices,
                "action": "insert"
            }
        })

    for query in test_queries:
        step += 1
        h1, h2, h3 = hash1(query, m), hash2(query, m), hash3(query, m)
        indices = sorted(list(set([h1, h2, h3])))
        all_set = all(bit_array[i] == 1 for i in indices)
        status_msg = "Definitely NOT in set (0 found)" if not all_set else "Possibly in set (all 1s)"
        states.append({
            "step": step,
            "description": f"Query '{query}': checked indices {indices}. Result: {status_msg}.",
            "stateData": {
                "array": bit_array.copy(),
                "m": m,
                "currentItem": query,
                "hashIndices": indices,
                "action": "query",
                "match": all_set
            }
        })

    return states

if __name__ == "__main__":
    results = bloom_filter_simulation()
    print("---OUTPUT_START---")
    print(json.dumps(results))
    print("---OUTPUT_END---")
`;
            const res = await this.executor.execute(pythonScript, array, target);
            return { ...res, algorithm: "Bloom Filter" };
        }
        else if (isBinarySearch) {
            pythonScript = `
import json
import sys

def binary_search_trace(arr, target):
    states = []
    left = 0
    right = len(arr) - 1
    step = 1

    states.append({
        "step": step,
        "description": f"Initialized search space: bounds [0, {right}], target {target}",
        "stateData": {
            "array": arr,
            "left": left,
            "right": right,
            "mid": None,
            "midVal": None,
            "target": target,
            "eliminated": [],
            "status": "initialized"
        }
    })

    found_index = -1
    while left <= right:
        step += 1
        mid = left + (right - left) // 2
        mid_val = arr[mid]

        if mid_val == target:
            states.append({
                "step": step,
                "description": f"Midpoint index {mid} with value {mid_val} matches target {target}!",
                "stateData": {
                    "array": arr,
                    "left": left,
                    "right": right,
                    "mid": mid,
                    "midVal": mid_val,
                    "target": target,
                    "eliminated": [i for i in range(len(arr)) if i < left or i > right],
                    "status": "found"
                }
            })
            found_index = mid
            break
        elif mid_val < target:
            states.append({
                "step": step,
                "description": f"arr[{mid}] ({mid_val}) < target ({target}). Discarding left interval [0..{mid}].",
                "stateData": {
                    "array": arr,
                    "left": left,
                    "right": right,
                    "mid": mid,
                    "midVal": mid_val,
                    "target": target,
                    "eliminated": [i for i in range(len(arr)) if i <= mid],
                    "status": "narrowing_right"
                }
            })
            left = mid + 1
        else:
            states.append({
                "step": step,
                "description": f"arr[{mid}] ({mid_val}) > target ({target}). Discarding right interval [{mid}..{len(arr)-1}].",
                "stateData": {
                    "array": arr,
                    "left": left,
                    "right": right,
                    "mid": mid,
                    "midVal": mid_val,
                    "target": target,
                    "eliminated": [i for i in range(len(arr)) if i >= mid],
                    "status": "narrowing_left"
                }
            })
            right = mid - 1

    assert found_index != -1, f"Expected to find {target} in sorted array"
    assert arr[found_index] == target, f"Element at index {found_index} must equal {target}"

    return states

if __name__ == "__main__":
    arr = ${JSON.stringify(array)}
    target = ${target}
    results = binary_search_trace(arr, target)
    print("---OUTPUT_START---")
    print(json.dumps(results))
    print("---OUTPUT_END---")
`;
            const res = await this.executor.execute(pythonScript, array, target);
            return { ...res, algorithm: "Binary Search" };
        }
        else {
            // General Dynamic Topic Simulation (System Architecture, Protocols, Operating Systems, Networks)
            const cleanTopic = topic.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "System Architecture";
            pythonScript = `
import json

def system_simulation():
    return [
        {"step": 1, "description": "Phase 1: Input initialization & constraint validation", "stateData": {"phase": "Initialization", "target": "${cleanTopic}", "active": True}},
        {"step": 2, "description": "Phase 2: Core invariant transformation & state progression", "stateData": {"phase": "Transformation", "target": "${cleanTopic}", "active": True}},
        {"step": 3, "description": "Phase 3: Verification & consistency check", "stateData": {"phase": "Verification", "target": "${cleanTopic}", "active": True}},
        {"step": 4, "description": "Phase 4: Output completion & deterministic guarantees", "stateData": {"phase": "Completion", "target": "${cleanTopic}", "active": True}}
    ]

if __name__ == "__main__":
    print("---OUTPUT_START---")
    print(json.dumps(system_simulation()))
    print("---OUTPUT_END---")
`;
            const res = await this.executor.execute(pythonScript, array, target);
            return { ...res, algorithm: cleanTopic };
        }
    }
}
