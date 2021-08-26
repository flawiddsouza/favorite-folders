import * as vscode from 'vscode'
import { readdirSync } from 'fs'
import path = require('path')
import os = require('os')

class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined
    absoluteFolderPath: string

    constructor(label: string, absoluteFolderPath: string, children?: TreeItem[]) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded)
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

class FavoriteFolders implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    data: TreeItem[] = []

    constructor() {
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
        const configuration = vscode.workspace.getConfiguration('favoriteFolders')
        const baseFolders: Array<string> = configuration.get('baseFolders') ?? []

        this.data = []

        baseFolders.forEach(baseFolder => {
            const baseFolderExpanded = baseFolder.replace('~', homeDirectory)
            try {
                this.data.push(
                    new TreeItem(
                        baseFolder,
                        baseFolderExpanded,
                        readdirSync(baseFolderExpanded, { withFileTypes: true })
                        .filter(item => item.isDirectory())
                        .map(item => item.name)
                        .sort(sortArray)
                        .map(item => new TreeItem(item, path.join(baseFolderExpanded, item)))
                    )
                )
            } catch (e) {
                vscode.window.showWarningMessage(`Favorite Folders: ${baseFolder} does not exist on your system`)
            }
        })

        this._onDidChangeTreeData.fire()
    }
}

export function activate(_context: vscode.ExtensionContext) {
    const favoriteFolders = new FavoriteFolders()
    vscode.window.registerTreeDataProvider('favoriteFolders', favoriteFolders)
    vscode.commands.registerCommand('favoriteFolders.refreshFolders', () => favoriteFolders.refreshFolders())
    vscode.commands.registerCommand('favoriteFolders.openFolder', treeItem => treeItem.openFolder())
    vscode.commands.registerCommand('favoriteFolders.openFolderInNewWindow', treeItem => treeItem.openFolder(true))
}
