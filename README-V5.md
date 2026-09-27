# Rover Portfolio V5 — Visual Editor

This update changes `/admin` from a traditional dashboard into an in-place visual site editor.

## What V5 adds
- Admin sees the real website while editing it.
- Edit buttons appear directly on the header, hero, every section, each content card, About, Contact, and Footer.
- Visitor Preview hides all editor controls while keeping unsaved changes visible.
- Site changes are local until `Save site design` is pressed.
- Discard restores the last saved site design.
- Brand editor: replace the R with an uploaded logo, upload/change favicon, hide/show name and alias.
- Header editor: show/hide header, sticky mode, language switch, home navigation label.
- Hero editor: all bilingual text, background image, side stamp, buttons and their targets.
- Theme editor: main/accent/background/panel/text/border colors, fonts, corner radius.
- Built-in sections: show/hide, show/hide in nav, rename in Arabic and English, reorder, change background surface.
- Section manager lets hidden sections be restored later.
- Add custom sections, with bilingual title/subtitle/body, optional image, layout, nav label, order, and visibility.
- Content manager lists visible and hidden/draft items and lets you recover/edit them.
- Add/edit/delete photos, films, apps/projects and creative work directly from the preview.
- Upload media to the existing `portfolio-media` Supabase bucket.
- About editor: text, image and stat labels.
- Contact editor: built-in links plus unlimited custom links.
- Footer editor: show/hide and bilingual copyright text.
- Dynamic browser tab icon (favicon) from site settings.

No database migration is required beyond the existing V4 `site_settings` table. Existing V4 settings are merged with the new V5 defaults automatically.
