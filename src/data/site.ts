// Business details used across the site, in structured data and in the brief
// form. Edited in the dashboard (content/settings.json). Empty fields are
// hidden on the site rather than shown as placeholders.
import { settings } from '../lib/content';

export const site = settings;
export type Site = typeof site;
