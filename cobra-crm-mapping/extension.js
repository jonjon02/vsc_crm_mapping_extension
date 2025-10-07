const consoleModule = require('console')
const vscode = require('vscode');
const fs = require('fs').promises

let MAPPING_PATH_KEY = '';
let dataCache = null;

// /Volumes/C$/cobraServer/MappingExport/cobra_crm_mapping.json

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	async function getAndValidateMappingPath() {
		let inputPath = context.globalState.get(MAPPING_PATH_KEY)
	
		if (!inputPath) {
			inputPath = await vscode.window.showInputBox({
				placeHolder: "Please provide the local path to your mapping.json file",
				prompt: "You have to provide this path only once"
			})
		
			if (!inputPath) {
				console.error("No path provided.")
				return null;
			} 
		await context.globalState.update(MAPPING_PATH_KEY, inputPath);
		}
		return inputPath;
	}

	async function loadMappingData() {

		if (dataCache) {
			return dataCache
		}

		const mappingPath = await getAndValidateMappingPath()
		
		if (!mappingPath) {
				return;
			}

		try {
			const fileContent = await fs.readFile(mappingPath, 'utf-8');
			const Data = JSON.parse(fileContent);
			dataCache = Data
			return Data
		}
		catch (error) {
			console.error("Error parsing JSON or reading file", error.message)
			vscode.window.showErrorMessage(`Error loading ${mappingPath}. Please try again. ${error.message}`)
			context.globalState.update(MAPPING_PATH_KEY, undefined)
			return null;
		}
	}

	const reloadPath = vscode.commands.registerCommand(
		'cobra-crm-mapping.newPath',
		async () => {

			MAPPING_PATH_KEY = '';
			dataCache = null;
			context.globalState.update(MAPPING_PATH_KEY, "")
			dataCache = getAndValidateMappingPath()
		}

		)
	
	const cobraColumns = vscode.commands.registerCommand(
		'cobra-crm-mapping.queryCobraColumns', 

		async () => {

			const mappingData = await loadMappingData();

			if (!mappingData) {
				return;
			}
		
			const cols = mappingData.sort().map(table => {
			return {
				label: `${table.ColNameLogical} \u{2192} [${table.ColNameUser}]`, 
				detail:  table.ColDescr,
				description:`Tabelle: ${table.TableNameUser} | ${table.TableNameLogical}`,
				tableLogical: table.TableNameLogical,
				colLogical: table.ColNameLogical,
				colUser: table.ColNameUser
				}
			})

			const selectedCol = await vscode.window.showQuickPick(cols,
			{ matchOnDetail: true, matchOnDescription: true
			 }
			)

			if (selectedCol) {

				console.log(selectedCol)

				let editor = vscode.window.activeTextEditor
								
				if(editor) {
					
					await vscode.languages.setTextDocumentLanguage(editor.document, 'sql')
					vscode.window.setStatusBarMessage('Sprachmodus auf SQL geändert', 3000)

					// const colValue = selectedCol.map(item => item.TableNameLogical)

					const sqlstring = `SELECT ${selectedCol.colLogical} AS [${selectedCol.colUser}] FROM ${selectedCol.tableLogical}`
					const snippet = new vscode.SnippetString(sqlstring)
					
					editor.insertSnippet(snippet)
				}
				
				else {
					vscode.window.showErrorMessage("Error: Please open a new editor window!")
				}

			}
		})

	const queryTables  = vscode.commands.registerCommand(
	'cobra-crm-mapping.queryCobraTables',

	async () => {
		const mappingData = await loadMappingData();
		
		if (!mappingData) {
			return
		}

		const distinctTablesMap = new Map()

		mappingData.forEach(item => {
			const logicalName = item.TableNameLogical

			if (!distinctTablesMap.has(logicalName)) {
				distinctTablesMap.set(logicalName, {
					label: item.TableNameLogical,
					detail: item.TableNameUser,
					description: "Database: 'Cobra_Data' | Schema: 'DBO'"
				}
				)
			}
		});

		const tables = Array.from(distinctTablesMap.values()).sort()

		const selectedTable = await vscode.window.showQuickPick(tables, { 
			matchOnDetail: true
		})

		if (selectedTable) {

			const cols = mappingData.sort().map(table => {
			return {
				label: `${table.ColNameLogical} \u{2192} [${table.ColNameUser}]`, 
				detail : `${table.TableNameUser} | ${table.TableNameLogical}`,
				description: table.ColNameLogical,
				colname: table.ColNameLogical,
				colnameuser: table.ColNameUser,
				tablename: table.TableNameLogical
				}
			})

			const filteredCols = Array.from(cols).filter(item => {
				return item.detail.startsWith(selectedTable.detail)
			})

			
			const optionsArray = [
				`Generate SELECT statement for "${selectedTable.label}" \u{2192} "${selectedTable.detail}"`, 
				`Show column mapping of "${selectedTable.label}"  \u{2192} "${selectedTable.detail}"`
			]
			const selectedAction = await vscode.window.showQuickPick(optionsArray)

			if (selectedAction === optionsArray[0]) {

				let editor = vscode.window.activeTextEditor

				if (editor) {
				
				await vscode.languages.setTextDocumentLanguage(editor.document, 'sql')
				vscode.window.setStatusBarMessage('Sprachmodus auf SQL geändert', 3000)

				const filteredCols = cols.filter(col => {
					return col.tablename === selectedTable.label
				})
				
				const tabString = "\t"
				const colValues = filteredCols.map(item => tabString + item.colname + " AS " + "["+item.colnameuser+"]")
		
				const sqlString = `SELECT\n${colValues.join(",\n")}\nFROM\n\t${selectedTable.label}`
				const snippet = new vscode.SnippetString(sqlString)
				
				editor.insertSnippet(snippet)
				}
			
				else {
					vscode.window.showErrorMessage("Error: Please open a new editor window!")
				}
			}

			if (selectedAction === optionsArray[1]) {
				await vscode.window.showQuickPick(filteredCols, {
					matchOnDescription: true,
					matchOnDetail: true
				})
			}
		}

	}
	)
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
