'use strict';
for (const element of document.querySelectorAll('[data-setting]')) {
 const value=window.BIZSTACKS_SITE?.[element.dataset.setting];
 if(value)element.textContent=value;
}
