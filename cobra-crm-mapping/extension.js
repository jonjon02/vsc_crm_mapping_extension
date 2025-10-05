const vscode = require('vscode');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	console.log('extension is active');
	vscode.window.showInformationMessage('Cobra-Mapping is active!');
	
	const Data = require('./data/cobra_crm_mapping.json');
	const arrow = '\&#8594'
	const cols = Data.map(table => {
		return {
			label: `${table.ColNameLogical} \u{2192} ${table.ColNameUser} | ${table.ColDescr}`, 
			detail : `Tabelle: ${table.TableNameUser} | ${table.TableNameLogical}`
		}
	})
	const disposable = vscode.commands.registerCommand(
		'cobra-crm-mapping.queryCobraMapping', 
		
		function () {
		const table = vscode.window.showQuickPick(cols, {
			matchOnDetail: true,

			
		})
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
