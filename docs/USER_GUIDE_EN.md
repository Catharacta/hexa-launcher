# Hexa Launcher User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Basic Operations](#basic-operations)
4. [Managing Cells](#managing-cells)
5. [Using Groups](#using-groups)
6. [Search Features](#search-features)
7. [Customization](#customization)
8. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

Welcome to Hexa Launcher! This guide will walk you through everything from basic usage to advanced features.

### What is Hexa Launcher?

Hexa Launcher is an innovative application launcher that uses a hexagonal grid layout. With keyboard-centric controls, you can quickly launch applications without touching your mouse.

---

## Installation

### Download and Install

1. Download the latest version from the [Releases](https://github.com/Catharacta/hexa-launcher/releases) page
2. Run `hexa-launcher-setup.exe`
3. Follow the installation wizard
4. After installation, press `Alt+Space` to launch

### First Launch

When you first launch, you'll see three special cells in the center:
- **Settings icon**: Opens the settings modal
- **Close button**: Closes the launcher
- **Tree button**: Shows the group hierarchy

---

## Basic Operations

### Show/Hide Launcher

- **Global Shortcut**: `Alt+Space`
  - Press this key combination from any application to summon the launcher
  - Press again to hide it

### Hex Navigation

Navigate the hexagonal grid using these keys:

```
    Q   W
  A   ●   S
    Z   X
```

- `Q`: Move to upper-left
- `W`: Move to upper-right
- `A`: Move to left
- `S`: Move to right
- `Z`: Move to lower-left
- `X`: Move to lower-right

### Launching Applications

1. Navigate to the desired app using navigation keys
2. Press `Enter` or click to launch

---

## Managing Cells

### Creating Shortcuts

#### Method 1: Keyboard Shortcuts

- `Ctrl+N`: Create a file shortcut
  - A dialog will open to select an executable file
  
- `Ctrl+Shift+N`: Create a folder shortcut
  - A dialog will open to select a folder

#### Method 2: Drag & Drop

1. Drag a file or folder from Explorer
2. Drop it onto an empty cell in the launcher
3. A shortcut will be created automatically

#### Method 3: Directional Creation

1. Select a cell
2. Press `Shift + Navigation Key` (e.g., `Shift+W`)
3. A shortcut creation dialog opens in the specified direction

### Editing Cells

#### Rename
1. Select a cell
2. Press `F2`
3. Enter a new name and press `Enter`

#### Change Icon
1. Right-click on a cell
2. Select "Change Icon"
3. Choose a new icon file

#### Advanced Settings
1. Right-click on a cell
2. Select "Edit"
3. Configure in the dialog:
   - Title
   - Icon
   - Target path
   - Arguments
   - Working directory
   - Run as administrator
   - Theme color (cell-specific color)

### Deleting Cells

1. Select a cell
2. Press `Delete`
3. Confirm in the dialog

### Moving Cells

#### Drag & Drop
1. Click and drag a cell
2. Drop it at the target position

#### Swap
- Drop a cell onto another cell to swap their positions

---

## Using Groups

Groups allow you to organize multiple applications like folders.

### Creating a Group

1. Press `Ctrl+G`
2. Enter a group name
3. A group cell is created

### Entering a Group

- Click on a group cell or press `Enter` to enter it
- Inside a group, you'll see special cells: "Back", "Close", and "Tree"

### Creating Cells in Groups

1. Inside a group, press `Ctrl+N` or `Ctrl+Shift+N`
2. Or use `Shift + Navigation Key` for directional creation

### Returning from a Group

- Click the "Back" cell
- Or press `Esc`

### Nested Groups

- You can create groups within groups
- Organize apps in a hierarchical structure

---

## Search Features

### Starting a Search

1. Press `Ctrl+F`
2. The search bar appears

### Search Modes

#### Fuzzy Search (Default)
- Fuzzy matching
- Example: "chr" → "Chrome", "Character Map"

#### Partial Match
- Searches for apps containing the input string
- Example: "fire" → "Firefox", "Firewall"

#### Regex (Regular Expression)
- Search using regex patterns
- Example: "^C.*e$" → "Chrome", "Code"

### Search Scope

Configurable in settings:
- **Current Group**: Search only within the current group
- **Global**: Search across all groups

### Search History

- Past search queries are automatically saved
- Press `↓` in the search bar to view history
- Up to 10 queries are saved

---

## Customization

### Opening Settings

1. Click the settings icon in the center
2. Or select the settings cell and press `Enter`

### General Settings

#### Auto Start
- Automatically launch Hexa Launcher when Windows starts

#### Language
- Japanese / English

#### Window Behavior
- **Always on Top**: Always display above other windows
- **Hide on Blur**: Automatically hide when clicking other apps
- **Show on Mouse Edge**: Automatically show when mouse reaches screen edge

### Appearance Settings

#### Theme Color
- Cyan
- Purple
- Pink
- Yellow
- Slate

#### Style
- **Default**: Clean and modern design
- **Cyberpunk**: Neon and glitch effects cyberpunk style

#### Opacity
- 0% (fully opaque) to 100% (fully transparent)

### Grid Settings

#### Hex Size
- Adjust cell size (40-100px)

#### Animation Speed
- **Fast**: Quick animations
- **Normal**: Standard speed
- **Slow**: Slow animations

#### Label Display
- **Always**: Always visible
- **Hover**: Visible on hover only
- **Never**: Hidden

#### Hover Effect
- Animation effects on mouse hover

### Key Bindings

Customize all keyboard shortcuts:

- Global toggle
- Hex navigation (6 directions)
- Actions (create, delete, rename, etc.)
- Search

### Security Settings

#### Admin Confirmation
- Show confirmation dialog when launching apps requiring admin rights

#### Launch Confirmation
- Show confirmation dialog before launching all apps

#### Trusted Paths
- Apps in specified paths launch without confirmation

---

## Keyboard Shortcuts Reference

### Global
| Key | Function |
|------|----------|
| `Alt+Space` | Show/Hide launcher |

### Navigation
| Key | Function |
|------|----------|
| `Q` | Move upper-left |
| `W` | Move upper-right |
| `A` | Move left |
| `S` | Move right |
| `Z` | Move lower-left |
| `X` | Move lower-right |
| `Enter` | Launch selected app |
| `Esc` | Close launcher |

### Cell Operations
| Key | Function |
|------|----------|
| `Ctrl+N` | Create file shortcut |
| `Ctrl+Shift+N` | Create folder shortcut |
| `Ctrl+G` | Create group |
| `F2` | Rename |
| `Delete` | Delete |
| `Shift + Q/W/A/S/Z/X` | Create cell in direction |

### Search
| Key | Function |
|------|----------|
| `Ctrl+F` | Open search bar |
| `Esc` | Close search |
| `↓` | Show search history |

---

## Frequently Asked Questions

### Q: The global shortcut doesn't work

**A**: Please check the following:
1. Is it conflicting with other applications?
2. Try changing the shortcut key in settings
3. Try running with administrator privileges

### Q: Icons are not displaying correctly

**A**: 
1. Settings > Advanced > Clear icon cache
2. Restart the app

### Q: I accidentally deleted a cell

**A**: 
- Currently, there is no undo feature
- You may be able to restore from the settings file (`%APPDATA%/hexa-launcher/settings.json`)

### Q: I want to reset settings

**A**:
1. Each settings tab has a "Reset to Defaults" button
2. Or delete the settings file: `%APPDATA%/hexa-launcher/settings.json`

### Q: Can I use it with multiple monitors?

**A**: 
- Yes, the "show on mouse edge" feature works on all monitors

### Q: Is there a portable version?

**A**: 
- Currently only the installer version is available
- A portable version is planned for future releases

---

## Support

If your issue persists:

1. Search existing issues on [GitHub Issues](https://github.com/Catharacta/hexa-launcher/issues)
2. Create a new issue to report
3. Ask the community in [Discussions](https://github.com/Catharacta/hexa-launcher/discussions)

---

**Enjoy Hexa Launcher!** 🎯
