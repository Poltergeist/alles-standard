# Alles Standard - Hugo Website

Alles Standard is a Hugo-based static website that displays Magic: The Gathering Standard format events around Hamburg, Germany. The site fetches event data from Wizards of the Coast API and displays upcoming events with details like location, timing, and entry fees.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build the Repository
- **Install Hugo v0.147.9 Extended** (required version for theme compatibility):
  - `wget https://github.com/gohugoio/hugo/releases/download/v0.147.9/hugo_extended_0.147.9_linux-amd64.deb`
  - `sudo dpkg -i hugo_extended_0.147.9_linux-amd64.deb`
  - Verify installation: `/usr/local/bin/hugo version`
- **Initialize theme submodule**:
  - `git submodule update --init --recursive`
- **Build the site**:
  - `/usr/local/bin/hugo --minify` -- completes in <0.2 seconds. NEVER CANCEL.

### Development Server
- **Start development server**:
  - `/usr/local/bin/hugo server --bind 0.0.0.0 --port 8080`
  - Site available at `http://localhost:8080`
  - Auto-reloads on file changes
  - **NEVER CANCEL** - let it run in background. Stop with Ctrl+C when done.

### Data Collection
- **Update event data**: `./collect.sh`
  - Fetches Magic: The Gathering Standard events from Wizards API
  - Saves data to `data/events.json`
  - **Note**: May fail in restricted network environments due to external API access

## Validation

### Manual Testing Scenarios
After making changes, **ALWAYS test these user scenarios**:
1. **Homepage loads**: `curl -I http://localhost:8080` should return 200 OK
2. **Events page displays**: `curl -s http://localhost:8080/events/ | grep -i "Events"` should find content
3. **Discord page works**: `curl -s http://localhost:8080/discord/ | grep -i "Discord"` should find content  
4. **Site builds cleanly**: Clean build should complete without errors in <0.2 seconds
5. **Navigation menu functions**: Both "Events" and "Discord" menu items should work
6. **All pages accessible**: Check `/`, `/events/`, `/discord/` return HTTP 200

### Build Validation
- **Clean build test**: Remove `public/` and `resources/` directories, then run full build
- **Production build**: `/usr/local/bin/hugo --minify` creates optimized output
- **Development build**: `/usr/local/bin/hugo` creates unminified output for debugging

## Build Times and Expectations
- **Hugo build**: <0.2 seconds - NEVER CANCEL, but timeouts are not needed
- **Theme submodule fetch**: 10-30 seconds depending on network - NEVER CANCEL, set timeout to 60+ seconds
- **Server startup**: <1 second - NEVER CANCEL
- **Hugo installer download**: 30-60 seconds depending on network - NEVER CANCEL, set timeout to 120+ seconds

## Common Tasks

### Repository Structure
```
.
├── .github/
│   └── workflows/build-deploy.yaml  # GitHub Pages deployment
├── archetypes/
│   └── default.md                   # Content template
├── content/
│   ├── discord.md                   # Discord page content
│   └── events.md                    # Events page content
├── data/
│   └── events.json                  # Event data from Wizards API
├── layouts/
│   └── events/single.html           # Events page template
├── static/
│   └── images/                      # Static assets
├── themes/
│   └── ananke/                      # Hugo theme (git submodule)
├── collect.sh                       # Data collection script
├── hugo.toml                        # Hugo configuration
└── README.md                        # Documentation (outdated)
```

### Key Configuration Files
- **hugo.toml**: Site configuration, theme selection, menu structure
- **collect.sh**: API data fetching script for Magic events
- **.github/workflows/build-deploy.yaml**: CI/CD pipeline for GitHub Pages
- **.gitignore**: Excludes Hugo build artifacts and temporary files

### Important Notes
- **Theme version**: Requires Hugo v0.147.9+ for compatibility with Ananke theme
- **Data source**: Events fetched from `api.tabletop.wizards.com` GraphQL API
- **Deployment**: Automatic GitHub Pages deployment on main branch push
- **Domain**: Site deployed to `alles-standard.social` via CNAME
- **README is outdated**: Contains Gatsby template content instead of Hugo documentation

### File Locations for Quick Access
- Event display template: `layouts/events/single.html`
- Site navigation: `hugo.toml` (menu section)
- Event data: `data/events.json`
- Static assets: `static/images/`
- Content pages: `content/` directory

### Troubleshooting
- **Build fails with theme errors**: Ensure Hugo v0.147.9+ is installed and theme submodule is initialized
- **Events not displaying**: Check `data/events.json` exists and contains valid JSON data
- **Server won't start**: Verify port 8080 is available or use `--port` flag for different port
- **Styling issues**: Clear `resources/` directory and rebuild to regenerate CSS
- **Submodule issues**: Run `git submodule update --init --recursive` to fetch theme

### Example Common Commands Output

#### Repository Root Listing
```
$ ls -la
drwxr-xr-x  .git/
drwxr-xr-x  .github/
-rw-r--r--  .gitignore
-rw-r--r--  README.md
drwxr-xr-x  archetypes/
-rwxr-xr-x  collect.sh
drwxr-xr-x  content/
drwxr-xr-x  data/
-rw-r--r--  hugo.toml
drwxr-xr-x  layouts/
drwxr-xr-x  static/
drwxr-xr-x  themes/
```

#### Hugo Version Check
```
$ /usr/local/bin/hugo version
hugo v0.147.9-29bdbde19c288d190e889294a862103c6efb70bf+extended linux/amd64 BuildDate=2025-06-23T08:22:20Z VendorInfo=gohugoio
```

#### Successful Build Output
```
$ /usr/local/bin/hugo --minify
Start building sites … 

                  │ EN 
──────────────────┼────
 Pages            │ 10 
 Paginator pages  │  0 
 Non-page files   │  0 
 Static files     │  3 
 Processed images │  0 
 Aliases          │  0 
 Cleaned          │  0 

Total in 89 ms
```