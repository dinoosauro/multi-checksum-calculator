import { useEffect, useRef, useState } from "react";
import CryptoJS from "crypto-js";
import OpenSourceDialog from "./OpenSourceDialog";

export default function App() {
  /**
   * The options of the application
   */
  let conversionSettings = useRef({
    currentOperations: 0,
    maxOperations: 3,
    chunkSize: 1024 * 512,
    pickFolder: false,
    hasSettingsBeenRestored: false,
    trackProgress: true
  });
  /**
   * Save the user settings in the LocalStorage
   */
  function saveSettings() {
    localStorage.setItem("MultiChecksumCalc-Settings", JSON.stringify(conversionSettings.current));
    localStorage.setItem("MultiChecksumCalc-AlgoStorage", JSON.stringify(suggestedAlgo.current))
  }
  /**
   * The array of files that need to be converted.
   * This is saved in an independent array so that we can keep track of the number of concurrent operations.
   */
  let fileArr: File[] = [];
  /**
   * The possible algorithms for the checksum calculation, obviously only if 
   */
  type AlgoType =
    | "SHA1"
    | "SHA256"
    | "SHA512"
    | "SHA224"
    | "SHA384"
    | "SHA3"
    | "MD5"
    | "RIPEMD160";
  type AlgoStorage = { [key in AlgoType]: boolean };
  /**
   * The content that should be displayed in the "Results tabs"
   */
  interface OutputTable {
    /**
     * The file name of the file
     */
    fileName: string;
    /**
     * An array of file hashes. The position in the array should correspond to the position of the `tableColumns` state: so, if a SHA256 has been calculated, and SHA256 is at position 2 in the `tableColumns` array, the value should be added in this array in the position 2.
     */
    hashes: string[];
    /**
     * A random identifier as a key for React
     */
    id: string;
  }
  /**
   * Track the progress of the current hashfile calculation
   */
  interface OutputProgress {
    /**
     * The name of the file
     */
    fileName: string,
    /**
     * The progress bar. This must be created by React when the re-render is triggered.
     * Note that the rerender occurs only for the creation of the row, but the value of the progress bar must be changed programmatically using classic JavaScript APIs.
     */
    progress?: HTMLProgressElement,
    /**
     * The maximum of the Progress Bar, so the file size
     */
    max: number
    /**
     * A random identifier as a key for React
     */
    id: string
  }
  const [tableColumns, updateTableColumns] = useState<string[]>([]); // An array of headers for the columns of the output table
  const [results, updateResults] = useState<OutputTable[]>([]); // The calculated hashes
  const [progress, updateProgress] = useState<OutputProgress[]>([]); // The files that are being handled, or that have already been handled
  const [showTables, updateShowTables] = useState(false); // Show the "Progress" and "Result" cards (so, this must be triggered after the user has chosen a file)
  const [showLicenses, updateShowLicenses] = useState(false); // Show the "Open source licenses" dialog
  const [csvDownloadLink, updateCsvDownloadLink] = useState<string | null>(null); // If this value is a string, an alert will be displayed at the top so that the user can redownload the csv file.
  /**
   * The list of available algorithms as a key, and as a value if they should be used for this conversion. 
   */
  const suggestedAlgo = useRef<AlgoStorage>({
    SHA1: true,
    SHA256: true,
    SHA512: false,
    SHA224: false,
    SHA384: false,
    SHA3: false,
    MD5: false,
    RIPEMD160: false,
  });
  /**
   * The file name the user has chosen for the CSV file
   */
  let csvFileName = useRef("");
  if (!conversionSettings.current.hasSettingsBeenRestored) { // Restore the settings. We cannot use an Effect since they're stored in a Ref and not in a State, so the default values of the inputs would be different 
    conversionSettings.current.hasSettingsBeenRestored = true;
    const prevSettings = JSON.parse(localStorage.getItem("MultiChecksumCalc-Settings") ?? "{}");
    for (const key in prevSettings) {
      if (typeof prevSettings[key] === "number" || typeof prevSettings[key] === "boolean" && key !== "currentOperations") conversionSettings.current[key as "pickFolder"] = prevSettings[key] as boolean;
    }
    const prevAlgo = JSON.parse(localStorage.getItem("MultiChecksumCalc-AlgoStorage") ?? "{}");
    for (const key in prevAlgo) {
      if (typeof prevAlgo[key] === "boolean") suggestedAlgo.current[key as "SHA1"] = prevAlgo[key];
    }
  }
  /**
   * Calculate the hash of the first file in the queue.
   * @param isAlreadyRunning if the function is being called recursively. This is done since, at the end, the function automatically looks if there are more files in the queue, and if so it takes the next file to analyze.
   */
  async function getShaSum(isAlreadyRunning?: boolean) {
    if (!isAlreadyRunning && conversionSettings.current.currentOperations >= conversionSettings.current.maxOperations) return; // There are too many operations that are running,
    const file = fileArr.splice(0, 1)[0];
    if (!file) { // There's nothing more to convert. This function will stop calling itself.
      conversionSettings.current.currentOperations--;
      return;
    }
    /**
     * The list of the algorithms to use for this operation
     */
    const outputOptions: AlgoType[] = [];
    /**
     * The Set that contains all the displayed algorithms result in the "Result" table.
     */
    const tempSet = new Set<string>(tableColumns);
    for (const key in suggestedAlgo.current) {
      if (suggestedAlgo.current[key as AlgoType]) {
        outputOptions.push(key as AlgoType);
        tempSet.add(key);
      }
    }
    /**
     * The algorithms that are being shown in the table
     */
    const currentTable = Array.from(tempSet);
    updateTableColumns(currentTable); // Maybe this was the first time the user has selected a certain algorithm, so we'll update the table header
    /**
     * The Object that contains the `item` AlgoType that is being used, and the `hash` object, that contains the necessary functions to update the hash.
     */
    const hashes = outputOptions.map((item) => {
      const hash = CryptoJS.algo[item].create();
      return { item, hash };
    });
    /**
     * The information about the current progress
     */
    let currentProgress: OutputProgress = {
      fileName: file.webkitRelativePath || file.name,
      max: file.size,
      id: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex)
    }
    conversionSettings.current.trackProgress && updateProgress(prev => [...prev, currentProgress]);
    for (let offset = 0; offset < file.size; offset += conversionSettings.current.chunkSize) { // Let's get this chunk of the Blob, and continue handling the hash.
      const chunk = file.slice(offset, offset + conversionSettings.current.chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      if (currentProgress.progress) currentProgress.progress.value += conversionSettings.current.chunkSize; // Maybe React still hasn't updated the DOM, so this might be undefined.
      for (const { hash } of hashes) hash.update(wordArray);
    }
    /**
     * An object array. Each entry contains the `item` AlgoType (so, which algorithm has been used) and the `hash` string, with the output checksum.
     */
    const outputHash = hashes.map((obj) => {
      return { ...obj, hash: obj.hash.finalize().toString() };
    });
    /**
     * The checksums in the position they needed to be added in the "Result" table
     */
    const outputStrings: string[] = [];
    for (const item of outputHash) {
      outputStrings[currentTable.indexOf(item.item)] = item.hash;
    }
    updateResults(prev => [...prev, {
      fileName: file.webkitRelativePath || file.name,
      hashes: outputStrings,
      id: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex),
    }]);
    /**
     * We need to update the progress bar so that it appears to be complete. Therefore, we'll wait that React renders the progress bar, and then we'll change its value.
     */
    function updateProgressBar() {
      if (!currentProgress.progress) {
        setTimeout(() => updateProgressBar(), 500);
        return;
      }
      currentProgress.progress.value = currentProgress.progress.max;
    };
    conversionSettings.current.trackProgress && updateProgressBar();
    getShaSum(true);
  }
  /**
   * The alert div that tells the user the download has started. A link to redownload the CSV is appended.
   */
  const downloadDialog = useRef<HTMLDivElement>(null);
  useEffect(() => { // Show the downloader div for 5 seconds. An opacity transition is added.
    setTimeout(() => {
      if (downloadDialog.current) {
        downloadDialog.current.style.opacity = "1";
        setTimeout(() => {
          if (downloadDialog.current) downloadDialog.current.style.opacity = "0";
          setTimeout(() => updateCsvDownloadLink(prev => { // Maybe the link has changed, and in this case we don't need to put it as null
            if (prev !== csvDownloadLink) {
              if (downloadDialog.current) downloadDialog.current.style.opacity = "1"; // Let's make this item visible again, since the link is different
              return prev;
            }
            return null;
          }), 200);
        }, 5000)
      }
    }, 15)
  }, [csvDownloadLink])
  return <>
    <header>
      <div className="flex hcenter gap">
        <img src="./icon.svg" style={{ width: "48px", height: "48px" }}></img>
        <h1>Multi Checksum Calculator</h1>
      </div>
      <p>Calculate the checksum of the selected files using many algorithms.</p>
    </header>
    <br></br>
    <div className="mainFlex flex wrap">
      <div className="card">
        <h2>Calculate the checksum using:</h2>
        <div className="flex wrap">
          {Object.keys(suggestedAlgo.current).map(algo => <label className="flex hcenter card" style={{ backgroundColor: "var(--secondcard)" }}>
            <input
              type="checkbox"
              defaultChecked={suggestedAlgo.current[algo as AlgoType]}
              onChange={(e) => { suggestedAlgo.current[algo as AlgoType] = e.target.checked }}
            />{algo}
          </label>)}
        </div>
      </div>
      <div className="card">
        <h2>Options:</h2>
        <label className="flex hcenter gap">
          Chunk size (in bytes): <input type="number" defaultValue={conversionSettings.current.chunkSize} onChange={(e) => { conversionSettings.current.chunkSize = +e.target.value; saveSettings() }}></input>
        </label><br></br>
        <label className="flex hcenter gap">
          Maxmimum concurrent calculations: <input type="number" defaultValue={conversionSettings.current.maxOperations} min={1} onChange={(e) => { conversionSettings.current.maxOperations = +e.target.value; saveSettings() }}></input>
        </label><br></br>
        <label className="flex hcenter gap">
          <input type="checkbox" defaultChecked={conversionSettings.current.pickFolder} onChange={(e) => { conversionSettings.current.pickFolder = e.target.checked; saveSettings() }}></input>Pick a folder
        </label><br></br>
        <label className="flex hcenter gap">
          <input type="checkbox" defaultChecked={conversionSettings.current.trackProgress} onChange={(e) => { conversionSettings.current.trackProgress = e.target.checked; saveSettings() }}></input>Track the checksum calculation progress
        </label>
      </div>
    </div><br></br><br></br>
    <button
      onClick={() => {
        const input = Object.assign(document.createElement("input"), {
          type: "file",
          multiple: true,
          webkitdirectory: conversionSettings.current.pickFolder,
          directory: conversionSettings.current.pickFolder,
          onchange: () => {
            if (!input.files) return;
            updateShowTables(true); // Show the Progress and Result tables
            fileArr.push(...input.files);
            console.log(`Added ${input.files.length} files`)
            for (let i = 0; i < Math.min(conversionSettings.current.maxOperations, input.files.length); i++) getShaSum();
          },
        });
        input.click();
      }}>Upload</button>
    {showTables && <>
      <br></br><br></br>
      <div className="card">
        <h2>Results:</h2>
        <div style={{ overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>File name:</th>
                {tableColumns.map(column => <th>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.map(file => <tr key={file.id}>
                <td>{file.fileName}</td>
                {file.hashes.map(hash => <td>{hash}</td>)}
              </tr>
              )}
            </tbody>
          </table>
        </div><br></br>
        <div className="card" style={{ backgroundColor: "var(--secondcard)" }}>
          <h3>Download CSV file</h3>
          <label className="flex hcenter gap">
            File name: <input type="text" defaultValue={csvFileName.current} onChange={(e) => { csvFileName.current = e.target.value; }}></input>
          </label><br></br>
          <button onClick={() => {
            let str = `"File name:",`;
            for (const item of tableColumns) str += `"${item}",`;
            str = str.substring(0, str.length - 1);
            for (const file of results) str += `\n"${file.fileName.replace(/\"/g, "\"\"")}",\"${file.hashes.join("\",\"")}\"`;
            const trimmedFileName = csvFileName.current.trim();
            const a = Object.assign(document.createElement("a"), {
              href: URL.createObjectURL(new Blob([str])),
              download: trimmedFileName === "" ? `MultiChecksumCalc-${Date.now()}.csv` : `${trimmedFileName}${trimmedFileName.endsWith(".csv") ? "" : ".csv"}`
            });
            a.click();
            updateCsvDownloadLink(a.href); // Show the "File downloaded" alert at the top of the screen
          }}>Export as a CSV file</button>
        </div>
      </div><br></br>
      <div className="card">
        <h2>Reading progress:</h2>
        <table>
          <thead>
            <tr>
              <th>File name:</th>
              <th>Progress:</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((singleProgress, i) => <tr key={singleProgress.id}>
              <td>{singleProgress.fileName}</td>
              <td><progress ref={(item) => { progress[i].progress = item ?? undefined }} max={singleProgress.max}></progress></td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    </>}<br></br><br></br>
    <p className="flex gap wrap">Everything is elaborated locally. <u onClick={() => updateShowLicenses(true)}>View open source licenses</u><a href="https://github.com/dinoosauro/multi-checksum-calculator" target="_blank">View on GitHub</a></p>
    {showLicenses && <OpenSourceDialog close={() => updateShowLicenses(false)}></OpenSourceDialog>}
    {csvDownloadLink && <div className="topDialog flex hcenter gap wcenter" ref={downloadDialog}>
      <span>Download started!</span><a href={csvDownloadLink} target="_blank" download={(() => {
        const trimmedFileName = csvFileName.current.trim();
        return trimmedFileName === "" ? `MultiChecksumCalc-${Date.now()}.csv` : `${trimmedFileName}${trimmedFileName.endsWith(".csv") ? "" : ".csv"}`;
      })()}>Try again</a>
    </div>}
  </>
}