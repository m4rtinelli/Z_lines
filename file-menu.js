$('open-file-menu').onclick=()=>{if(shuffleJob)finishShuffle();$('file-menu').showModal()};
document.querySelectorAll('[data-file-action]').forEach(button=>button.onclick=()=>{
 $('file-menu').close();
 if(shuffleJob)finishShuffle();
 $(button.dataset.fileAction).click();
});
