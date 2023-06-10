# Favorite Folders

This extension gives you a list of all the direct folders under the settings.

![extension](https://raw.githubusercontent.com/flawiddsouza/favorite-folders/master/media/screenshots/extension.png)

## Extension settings

This extension contributes the following settings:

* `favoriteFolders.baseFolders`: set base folders from where your favorite folders will be listed.
* `favoriteFolders.baseFoldersExtended`: set base folders from where your favorite folders will be listed. This parameter allows you to set a name to a path.

## Examples

Example: specify a list of base Folders:

```json
"favoriteFolders.baseFolders": [
    "~/reposPersonal",
    "~/reposWork"
]
```

Example: specify a list of base Folders (with names):

```json
"favoriteFolders.baseFoldersExtended": [
    {
        "name": "Personal repositories",
        "path": "~/reposPersonal"
    },
    {
        "name": "Work repositories",
        "path": "~/reposWork"
    },
]
```

## Known issues

If you're on WSL, you'll see this when you open settings for the extension:
![settings-wsl-1](https://raw.githubusercontent.com/flawiddsouza/favorite-folders/master/media/screenshots/settings-wsl-1.png)

You'll have to select the 2nd tab to get the settings for the remote WSL environment.
![settings-wsl-2](https://raw.githubusercontent.com/flawiddsouza/favorite-folders/master/media/screenshots/settings-wsl-2.png)

This is a known issue in VS Code (<https://github.com/microsoft/vscode/issues/102146>).
