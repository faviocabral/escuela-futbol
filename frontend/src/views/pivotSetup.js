// jQuery UI (dist) y pivottable buscan `jQuery` global (no CommonJS).
// Este módulo se importa PRIMERO en ReportesView para exponerlo.
import $ from 'jquery';

window.$ = $;
window.jQuery = $;

export default $;
