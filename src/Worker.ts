import CryptoJS from "crypto-js";
import type { AlgoType } from "./Interfaces";

let hashes: {
    hash: any,
    item: AlgoType
}[] = [];

onmessage = (msg) => {
    switch (msg.data.action) {
        case "Start": { // Create the hash objects
            const outputOptions = msg.data.content as AlgoType[];
            /**
             * The Object that contains the `item` AlgoType that is being used, and the `hash` object, that contains the necessary functions to update the hash.
             */
            hashes = outputOptions.map((item) => {
                const hash = CryptoJS.algo[item].create();
                return { item, hash };
            });
            postMessage({ id: msg.data.id });
            break;
        }
        case "AddBuffer": { // Add a small ArrayBuffer to the hash
            const wordArray = CryptoJS.lib.WordArray.create(msg.data.content as ArrayBuffer);
            for (const { hash } of hashes) hash.update(wordArray);
            postMessage({ id: msg.data.id });
            break;
        }
        case "GetString": { // Finalize the array
            /**              
             * An object array. Each entry contains the `item` AlgoType (so, which algorithm has been used) and the `hash` string, with the output checksum.              
            */
            const outputHash = hashes.map((obj) => {
                return {
                    ...obj, hash: obj.hash.finalize().toString()
                };
            });
            postMessage({action: "HashesReady", content: outputHash, id: msg.data.id});
        }
    }
}