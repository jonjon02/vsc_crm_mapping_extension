// @ts-nocheck
const vscode = require('vscode');
const fs = require('fs').promises;

let MAPPING_PATH_KEY = '';
let dataCache = null;	

/**
 * @param {{ globalState: { get: (arg0: string) => any; update: (arg0: string, arg1: string) => void; }; }} context
 */
function activate(context) {

	async function getAndValidateMappingPath() {
		let inputPath = context.globalState.get(MAPPING_PATH_KEY);
	
		if (!inputPath) {
			inputPath = await vscode.window.showInputBox({
				placeHolder: "Please provide the local path to your mapping.json file",
				prompt: "You have to provide this path only once",
				title: "JSON-Path"
				})
		
			if (!inputPath) {
				console.error("No path provided.");
				return null;
				} 

			await context.globalState.update(MAPPING_PATH_KEY, inputPath);
		}
		
		return inputPath;
	}

	async function loadMappingData() {

		if (dataCache) {
			return dataCache;
			}

		const mappingPath = await getAndValidateMappingPath();
		
		if (!mappingPath) {
			return;
			}

		try {
			const fileContent = await fs.readFile(mappingPath, 'utf-8');
			const Data = JSON.parse(fileContent);
			dataCache = Data;
			return Data;
			}
			
		catch (error) {
			console.error("Error parsing JSON or reading file", error.message);
			vscode.window.showErrorMessage(`Error loading ${mappingPath}. Please try again. ${error.message}`);
			context.globalState.update(MAPPING_PATH_KEY, undefined);
			return null;
		}
	}
	// eslint-disable-next-line no-unused-vars
	const reloadPath = vscode.commands.registerCommand(
		'cobra-crm-mapping.newPath',
		async () => {

			MAPPING_PATH_KEY = "";
			dataCache = null;
			context.globalState.update(MAPPING_PATH_KEY, "");
			const inputPath = await getAndValidateMappingPath();
			
			if (inputPath) {
			
				console.log(context.globalState.get(MAPPING_PATH_KEY));
				vscode.window.showInformationMessage("Path loaded sucessfully: " + inputPath);
				vscode.commands.executeCommand('cobra-crm-mapping.queryCobraColumns');
		
				}
			}
		)

	// eslint-disable-next-line no-unused-vars
	const cobraColumns = vscode.commands.registerCommand(
		'cobra-crm-mapping.queryCobraColumns', 
		async () => {

		const mappingData = await loadMappingData();

		if (!mappingData) {
			return;
			}
	
		const cols = mappingData.sort().map(
			(/** @type {{ ColNameLogical: String; 
						ColNameUser: String; 
						ColDescr: String; 
						TableNameUser: String; 
						TableNameLogical: String; }} */ table) => {
			return {
				label: `${table.ColNameLogical} \u{2192} [${table.ColNameUser}]`, //Quickpick-Label
				detail:  table.ColDescr, //Quickpick-Label
				description:`Tabelle: ${table.TableNameLogical} | ${table.TableNameUser}`,//Quickpick-Label
				
				tableLogical: table.TableNameLogical, // Data for extension logic
				tableUser: table.TableNameUser, // Data for extension logic
				colLogical: table.ColNameLogical, // Data for extension logic
				colUser: table.ColNameUser // Data for extension logic
				}
			})

			const selectedCol = await vscode.window.showQuickPick(cols,
				{ 	matchOnDetail: true, 
					matchOnDescription: true,
					title: "Column View - Click to Generate SELECT Statement"
				})

		if (selectedCol) {

			let editor = vscode.window.activeTextEditor;
							
			if(editor) {
				
				await vscode.languages.setTextDocumentLanguage(editor.document, 'sql');
				vscode.window.setStatusBarMessage('Sprachmodus auf SQL geändert', 3000);

				const sqlstring = `SELECT ${selectedCol.colLogical } AS [${selectedCol.colUser}] FROM ${selectedCol.tableLogical}`;
				const snippet = new vscode.SnippetString(sqlstring);
				
				editor.insertSnippet(snippet);
				}
			
			else {
				vscode.window.showErrorMessage("Error: No Editor! Please Open a New Editor Window.");
				}

			}
		})

	// eslint-disable-next-line no-unused-vars
	const queryTables  = vscode.commands.registerCommand(
	'cobra-crm-mapping.queryCobraTables',
	async () => {
		
		const mappingData = await loadMappingData();
		
		if (!mappingData) {
			return;
			}

		const distinctTablesMap = new Map();

		mappingData.forEach((/** @type {{ TableNameLogical: String; TableNameUser: String; }} */ item) => {
			const logicalName = item.TableNameLogical;

			if (!distinctTablesMap.has(logicalName)) {
				distinctTablesMap.set(logicalName, {
					label: item.TableNameLogical,
					detail: item.TableNameUser,
					description: "Database: 'Cobra_Data' | Schema: 'DBO'"
					})
				}
			});

		const tables = Array.from(distinctTablesMap.values()).sort();

		const selectedTable = await vscode.window.showQuickPick(tables,
			{ 	matchOnDetail: true ,
				title: "Table View - Click for more Options"
			});

		if (selectedTable) {

			try {

			const cols = mappingData.sort().map(
				/** @type {{ ColNameLogical: String; 
							ColNameUser: String; 
							TableNameUser: String; 
							TableNameLogical: String; }} */ table => {
				return {
					label: `${table.ColNameLogical} \u{2192} [${table.ColNameUser}]`, 
					detail : `${table.TableNameUser} | ${table.TableNameLogical}`,
					description: table.ColNameLogical,

					tableLogical: table.TableNameLogical, // Data for extension logic
					tableUser: table.TableNameUser, // Data for extension logic
					colLogical: table.ColNameLogical, // Data for extension logic
					colUser: table.ColNameUser // Data for extension logic
					}
				})

			const filteredCols = Array.from(cols).filter(item => {
				return item.detail.startsWith(selectedTable.detail)
				})

			
			const optionsArray = [
				`Generate SELECT Statement for "${selectedTable.label}" \u{2192} "${selectedTable.detail}"`, 
				`Show Column Mapping of "${selectedTable.label}"  \u{2192} "${selectedTable.detail}"`
			]

			const selectedAction = await vscode.window.showQuickPick(optionsArray, 
				{ title: "Select Next Step" });

			if (selectedAction === optionsArray[0]) {

				let editor = vscode.window.activeTextEditor;

				if (editor) {
				
					await vscode.languages.setTextDocumentLanguage(editor.document, 'sql')
					vscode.window.setStatusBarMessage('Sprachmodus auf SQL geändert', 3000)

					const filteredCols = cols.filter(/** @type {{ tableUser: String; }} */ col => {
						return col.tableLogical === selectedTable.label
					})
					
					const tabString = "\t"
					const colValues = filteredCols.map((/** @type {{ colLogical: String; ColUser: String; }} */ item) => 
						tabString + item.colLogical + " AS " + "["+item.colUser+"]");
			
					const sqlString = `SELECT\n${colValues.join(",\n")}\nFROM\n\t${selectedTable.label}`;
					const snippet = new vscode.SnippetString(sqlString);
					
					editor.insertSnippet(snippet);

					}
			
				else {
					vscode.window.showErrorMessage("Error: No Editor! Please Open a New Editor Window.");
					}		
				}	

			if (selectedAction === optionsArray[1]) {

				const selectedCols = await vscode.window.showQuickPick(filteredCols, {
					matchOnDescription: true,
					matchOnDetail: true,
					canPickMany: true,
					title: "Select Columns"
					})
				
				console.log(selectedCols.map((/** @type {{ colLogical: String; ColUser: String; }} */ item) => 
						"\t" + item.colLogical + " AS " + "["+item.colUser+"]"))

				if (selectedCols) {

					let editor = vscode.window.activeTextEditor;
								
					if(editor) {

						const tabString = "\t"
						
						await vscode.languages.setTextDocumentLanguage(editor.document, 'sql');
						vscode.window.setStatusBarMessage('Sprachmodus auf SQL geändert', 3000);

						const colValues = selectedCols.map((/** @type {{ colLogical: String; ColUser: String; }} */ item) => 
						tabString + item.colLogical + " AS " + "["+item.colUser+"]");

						const sqlstring = `SELECT\n${colValues.join(",\n")}\nFROM\n\t${selectedTable.label}`;
						const snippet = new vscode.SnippetString(sqlstring);
						
						editor.insertSnippet(snippet);
						}
					
					else {
						vscode.window.showErrorMessage("Error: No Editor! Please Open a New Editor Window.");
						}
					}
				}
		
			}
			
			catch (err) {
				vscode.window.showErrorMessage(`Error: Process Cancelled: ${err.message}`)
				}
		}
	})
}	

function deactivate() {}

module.exports = {
	activate,
	deactivate
}