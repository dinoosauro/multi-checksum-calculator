import { useEffect, useRef, useState } from "react";

interface LicenseOptions {
    link: string,
    type: "mit" | "bsd",
    authors: string
}

interface Props {
    /**
     * The function that is called when the user wants to close the dialog. When this is called, the opacity transition has already ended.
     */
    close: () => void
}
/**
 * The Dialog that shows the Open Source licenses
 * @returns the OpenSourceDialog ReactNode
 */
export default function OpenSourceDialog({ close }: Props) {
    const licensesLink = new Map<string, LicenseOptions>([
        ["crypto-js", { type: "mit", authors: "2009-2013 Jeff Mott\nCopyright (c) 2013-2016 Evan Vosberg", link: "https://github.com/brix/crypto-js" }],
        ["react", { type: "mit", authors: "Meta Platforms, Inc. and affiliates.", link: "https://github.com/facebook/react" }],
        ["fluent", { type: "mit", authors: "2020 Microsoft Corporation", link: "https://github.com/microsoft/fluentui-system-icons" }],
        ["multichecksumcalc", { type: "mit", authors: "2025 Dinoosauro", link: "https://github.com/dinoosauro/multi-checksum-calculator" }],
        ["zipjs", { type: "bsd", authors: "2023, Gildas Lormeau", link: "https://github.com/gildas-lormeau/zip.js" }]
    ]);
    const [selectedEntry, updateSelectedEntry] = useState<LicenseOptions>(licensesLink.get("crypto-js") as LicenseOptions);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setTimeout(() => { if (ref.current) ref.current.style.opacity = "1" }, 25);
    }, [])
    return <div ref={ref} className="dialog">
        <div className="card">
            <h2>Open source licenses</h2>
            <select onChange={(e) => updateSelectedEntry(licensesLink.get(e.target.value) as LicenseOptions)}>
                <option value="crypto-js">crypto-js</option>
                <option value="zipjs">zip.js</option>
                <option value="react">React</option>
                <option value="fluent">Fluent UI System Icons</option>
                <option value="multichecksumcalc">Multi Checksum Calculator</option>
            </select><br></br><br></br>
            <div className="card" style={{ backgroundColor: "var(--secondcard)" }}>
                {selectedEntry.type === "mit" ?
                    <p>
                        MIT License<br></br><br></br>Copyright (c) {selectedEntry.authors}<br></br><br></br>

                        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                        <ul>
                            <li>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</li>
                        </ul>

                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

                    </p> : <p>
                        BSD 3-Clause License<br></br><br></br>

                        Copyright (c) {selectedEntry.authors}<br></br><br></br>

                        Redistribution and use in source and binary forms, with or without
                        modification, are permitted provided that the following conditions are met:<br></br><br></br>
                        <ol>
                            <li>Redistributions of source code must retain the above copyright notice, this
                                list of conditions and the following disclaimer.</li>
                            <li>Redistributions in binary form must reproduce the above copyright notice,
                                this list of conditions and the following disclaimer in the documentation
                                and/or other materials provided with the distribution.</li>
                            <li>Neither the name of the copyright holder nor the names of its
                                contributors may be used to endorse or promote products derived from
                                this software without specific prior written permission.</li>
                        </ol><br></br><br></br>

                        THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
                        AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                        IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                        DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
                        FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
                        DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
                        SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
                        CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
                        OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
                        OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                    </p>}<br></br>
                <a href={selectedEntry.link} target="_blank">View on GitHub</a><br></br><br></br>
            </div><br></br>
            <button onClick={async () => {
                if (ref.current) {
                    ref.current.style.opacity = "0";
                    await new Promise(res => setTimeout(res, 210));
                    close();
                }
            }}>Close</button>
        </div>
    </div>
}