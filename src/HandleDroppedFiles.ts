/**
 * Navigate through the dropped directories and get all the files that have been dropped.
 * @param files the FileSystemEntries that have been fetched by the `onDrop` event
 * @returns a file array with all the files. The file path is added in the `_path` property.
 */
export default async function HandleDroppedFiles(files: FileSystemEntry[]) {
    const output: File[] = [];
    async function addFile(path = "", file: FileSystemEntry) {
        if (file.isFile) {
            await new Promise<void>(res => {
                (file as FileSystemFileEntry).file((actualFile) => {
                    actualFile._path = `${path}${path === "" ? "" : "/"}${actualFile.name}`;
                    output.push(actualFile);
                    res();
                }, (err) => {
                    console.error(err);
                    res();
                })
            })
        } else if (file.isDirectory) {
            await new Promise<void>(res => {
                (file as FileSystemDirectoryEntry).createReader().readEntries(async (dir) => {
                    for (const item of dir) await addFile(`${path}${path === "" ? "" : "/"}${item.name}`, item);
                    res();
                }, (err) => {
                    console.error(err);
                    res();
                })
            })
        }
    }
    for (const item of files) await addFile(undefined, item);
    return output;
}