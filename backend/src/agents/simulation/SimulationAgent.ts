import { SimulationResult, SimulationState } from "../../shared/types/index.js";
import { ModalExecutor, SimulationExecutor } from "../../providers/modal/ModalExecutor.js";
import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";

export class SimulationAgent {
  private executor: SimulationExecutor;
  private llm?: LLMProvider;

  constructor(executor?: SimulationExecutor, llm?: LLMProvider) {
    this.executor = executor || new ModalExecutor();
    this.llm = llm;
  }

  async runSimulation(topic: string, algorithmParams?: { target?: number; array?: number[] }): Promise<SimulationResult> {
    const t = topic.toLowerCase();
    const isBinarySearch = t.includes("binary search");
    const isBloomFilter = t.includes("bloom");
    const isTree = t.includes("b-tree") || t.includes("tree");

    let pythonScript = "";
    const target = algorithmParams?.target ?? 42;
    const array = algorithmParams?.array ?? [7, 14, 21, 28, 35, 42, 49, 56, 63];

    if (isBloomFilter) {
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

    } else if (isBinarySearch) {
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

    } else {
      // General Protocol / System / Architecture Simulation (e.g. SSL/TLS, DNS, Operating Systems, TCP)
      pythonScript = `
import json

def protocol_trace():
    return [
        {"step": 1, "description": "Client initial handshake hello", "stateData": {"phase": "ClientHello", "cipherSuites": ["TLS_AES_256_GCM_SHA384"]}},
        {"step": 2, "description": "Server certificate chain transmission & verification", "stateData": {"phase": "CertificateVerification", "caSigned": True}},
        {"step": 3, "description": "Key exchange & symmetric session key generation", "stateData": {"phase": "KeyExchange", "encrypted": True}},
        {"step": 4, "description": "Encrypted secure session established", "stateData": {"phase": "SecureSession", "trafficEncrypted": True}}
    ]

if __name__ == "__main__":
    print("---OUTPUT_START---")
    print(json.dumps(protocol_trace()))
    print("---OUTPUT_END---")
`;
      const res = await this.executor.execute(pythonScript, array, target);
      return { ...res, algorithm: "Protocol Handshake" };
    }
  }
}
