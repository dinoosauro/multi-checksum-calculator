  /**
   * The possible algorithms for the checksum calculation, obviously only if 
   */
  export type AlgoType =
    | "SHA1"
    | "SHA256"
    | "SHA512"
    | "SHA224"
    | "SHA384"
    | "SHA3"
    | "MD5"
    | "RIPEMD160";
  export type AlgoStorage = { [key in AlgoType]: boolean };
