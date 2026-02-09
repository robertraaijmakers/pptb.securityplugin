# Security Roles Explorer

Power Platform ToolBox tool for inspecting and managing Dataverse security roles, table privileges, and user assignments.

## Overview

Security Roles Explorer helps you quickly understand which roles grant access to which tables and lets you update privileges or user-role assignments in one place.

## Features

- View role privileges by role or by table
- Batch cache of role privilege data for faster loading
- Sort and filter by privilege level
- Rights filter (all / with rights / without rights)
- Role multi-select filter (entity mode)
- Apply or undo pending privilege changes
- Assign or remove roles for users (role -> users or user -> roles)
- Activity log with timestamps
- Light/dark theme support with a manual toggle

## Requirements

- Power Platform ToolBox (desktop app)
- Node.js 18+ (recommended)

## Development

Install dependencies:

```bash
npm install
```

Build once:

```bash
npm run build
```

Watch mode:

```bash
npm run build:watch
```

## Loading in ToolBox

1. Enable Debug Menu in ToolBox settings.
2. Use Debug > Load Local Tool and select this folder.
3. Close and reopen the tool to refresh changes.

## Usage

1. Select a connection in ToolBox.
2. Choose a filter mode:
	- By role: review privileges for a single role.
	- By entity: compare multiple roles for a single table.
3. Use the filters and sort controls to narrow results.
4. Change privilege levels in the grid and click Apply changes.
5. Use the Assign security roles tab to add/remove roles for users.

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Make changes with small, focused commits.
4. Run `npm run build` and verify in ToolBox.
5. Open a pull request with a clear description and screenshots if UI changes.

## Troubleshooting

- If the tool shows "Not connected", select a connection in ToolBox and reload.
- If role privileges fail to load, verify the connection user has the required security role permissions.
- If UI changes do not appear, ensure `npm run build` completed and reopen the tool.

## License

MIT
