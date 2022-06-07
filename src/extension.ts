import * as vscode from 'vscode'
import { readdirSync } from 'fs'
import path = require('path')
import os = require('os')

class TreeItem extends vscode.TreeItem {
    label: string
    children: TreeItem[] | undefined
    absoluteFolderPath: string

    constructor(label: string, collapseState: vscode.TreeItemCollapsibleState, absoluteFolderPath: string, children?: TreeItem[]) {
        super(label, collapseState)
        this.label = label
        this.children = children
        this.absoluteFolderPath = absoluteFolderPath
    }

    iconPath = new vscode.ThemeIcon('symbol-folder')

    openFolder(newWindow = false) {
        const uri = vscode.Uri.file(this.absoluteFolderPath)
        vscode.commands.executeCommand('vscode.openFolder', uri, newWindow)
    }
}

const homeDirectory: string = os.homedir()

function sortArray(a: string, b: string) {
    return a.localeCompare(b)
}

const extensionNamespace: string = 'favoriteFolders'

class FavoriteFolders implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    data: TreeItem[] = []

    extensionContext: vscode.ExtensionContext

    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext
        this.refreshFolders()
    }

    getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }

    getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
        if (element === undefined) {
            return this.data
        }
        return element.children
    }

    refreshFolders() {
        const configuration = vscode.workspace.getConfiguration(extensionNamespace)
        const baseFolders: Array<string> = configuration.get('baseFolders') ?? []

        this.data = []

        const savedCollapsibleState: any = this.extensionContext.globalState.get('collapsibleState') ?? {}

        baseFolders.forEach(baseFolder => {
            const baseFolderExpanded = baseFolder.replace('~', homeDirectory)
            const collapseState = baseFolder in savedCollapsibleState ? savedCollapsibleState[baseFolder] : vscode.TreeItemCollapsibleState.Expanded;
            try {
                this.data.push(
                    new TreeItem(
                        baseFolder,
                        collapseState,
                        baseFolderExpanded,
                        readdirSync(baseFolderExpanded, { withFileTypes: true })
                        .filter(item => item.isDirectory())
                        .map(item => item.name)
                        .sort(sortArray)
                        .map(item => new TreeItem(item, vscode.TreeItemCollapsibleState.None, path.join(baseFolderExpanded, item)))
                    )
                )
            } catch (e) {
                // console.log(e)
                vscode.window.showWarningMessage(`Favorite Folders: ${baseFolder} does not exist on your system`)
            }
        })

        // cleanup paths from savedCollapsibleState that are no longer present {
        for (const baseFolder of Object.keys(savedCollapsibleState)) {
            if (!baseFolders.includes(baseFolder)) {
                delete savedCollapsibleState[baseFolder];
            }
        }
        this.extensionContext.globalState.update('collapsibleState', savedCollapsibleState)
        // }


        this._onDidChangeTreeData.fire()
    }

    openSettings() {
        vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${this.extensionContext.extension.id}`)
    }
}

function saveCollapsibleState(context: vscode.ExtensionContext, label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    const savedCollapsibleState: any = context.globalState.get('collapsibleState') ?? {}
    savedCollapsibleState[label] = collapsibleState
    context.globalState.update('collapsibleState', savedCollapsibleState)
}

export function activate(context: vscode.ExtensionContext) {
    const favoriteFolders = new FavoriteFolders(context)
    const treeView = vscode.window.createTreeView(extensionNamespace, {
        treeDataProvider: favoriteFolders
    })
    treeView.onDidCollapseElement(e => {
        saveCollapsibleState(context, e.element.label, vscode.TreeItemCollapsibleState.Collapsed)
    })
    treeView.onDidExpandElement(e => {
        saveCollapsibleState(context, e.element.label, vscode.TreeItemCollapsibleState.Expanded)
    })
    vscode.commands.registerCommand(`${extensionNamespace}.refreshFolders`, () => favoriteFolders.refreshFolders())
    vscode.commands.registerCommand(`${extensionNamespace}.openSettings`, () => favoriteFolders.openSettings())
    vscode.commands.registerCommand(`${extensionNamespace}.openFolder`, treeItem => treeItem.openFolder())
    vscode.commands.registerCommand(`${extensionNamespace}.openFolderInNewWindow`, treeItem => treeItem.openFolder(true))
}
