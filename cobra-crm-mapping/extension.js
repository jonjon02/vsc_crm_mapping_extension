const vscode = require('vscode');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('extension is active');
	vscode.window.showInformationMessage('Cobra-Mapping is active!');
	
	var Data = require('./data/cobra_crm_mapping.json');
	const arrow = '\&#8594'
	const cols = Data.sort().map(table => {
		return {
			label: `${table.ColNameLogical} \u{2192} ${table.ColNameUser}`, 
			detail : `Tabelle: ${table.TableNameUser} | ${table.TableNameLogical}`,
			description: table.ColDescr
		}
	})
	
	const test = vscode.commands.registerCommand(
		'cobra-crm-mapping.queryCobraColumns', 
		
		function () {
		const table = vscode.window.showQuickPick(cols, {
			matchOnDetail: true
		})
	});	

	const queryTables  = vscode.commands.registerCommand(
	'cobra-crm-mapping.queryCobraTables',

	async function() {

	const editor = vscode.window.activeTextEditor
	const snippet = new vscode.SnippetString(
		"SELECT ${cols.ColumnNameLogical} FROM `${tables.TableNameLogical}"
	)

		const tables = await vscode.window.showQuickPick(
			[... (new Set(Data.map(item => 
				`${item.TableNameLogical} \u{2192} ${item.TableNameUser}`)
				)
			)].sort()
			)
		
		if (tables) {
			vscode.window.showInformationMessage(`Sie haben ${tables} gewählt`)
			//editor.insertSnippet(`${tables.T})
		}
	})
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
