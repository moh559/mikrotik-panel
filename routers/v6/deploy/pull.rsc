# cloud panel - data pull (every minute) + assets pull (daily)
/system scheduler remove [find name=panel_pull]
/system script remove [find name=panel_pull]
# ---- mohammed (portal data) ----
/system script remove [find name=panel_pull_mohammed]
/system script add name=panel_pull_mohammed comment="cloud panel data pull" source={
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/settings.json" dst-path="1/data/settings.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/speeds.json" dst-path="1/data/speeds.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/profiles.json" dst-path="1/data/profiles.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/points.json" dst-path="1/data/points.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/text.json" dst-path="1/data/text.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/colors.json" dst-path="1/data/colors.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/colors-default.json" dst-path="1/data/colors-default.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/images.json" dst-path="1/data/images.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/slots.json" dst-path="1/data/slots.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/data/styles.json" dst-path="1/data/styles.json"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/config/config.js" dst-path="1/config/config.js"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/conf.js" dst-path="1/conf.js"
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/link.js" dst-path="1/link.js"
}
/system scheduler remove [find name=panel_pull_mohammed]
/system scheduler add name=panel_pull_mohammed interval=1m start-time=startup comment="cloud panel pull" on-event=panel_pull_mohammed
/system script remove [find name=panel_assets_mohammed]
/system script add name=panel_assets_mohammed comment="cloud panel assets (images)" source={
/tool fetch url="https://raw.githubusercontent.com/moh559/mikrotik-panel/main/routers/v6/deploy/assets.rsc" dst-path="1/assets.rsc"
/import file-name="1/assets.rsc"
}
/system scheduler remove [find name=panel_assets_mohammed]
/system scheduler add name=panel_assets_mohammed interval=1d start-time=03:00:00 comment="cloud panel assets" on-event=panel_assets_mohammed
