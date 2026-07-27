var e={mode:`MODE1_WAME`},t=e=>{let t=`${window.location.origin}${window.location.pathname}#/checkout/${e.id}`;return`Dear ${e.name},

Your meeting at Indus Fire Safety Pvt Ltd has been completed.

Please proceed to the Security Gate to complete your checkout.

Click the link below:
${t}

Thank you.`},n=n=>{if(!n.mobile)return console.warn(`Cannot send WhatsApp notification: Visitor mobile number is missing.`),!1;let r=t(n);if(e.mode===`MODE1_WAME`){let e=n.mobile.replace(/\D/g,``);e.length===10&&(e=`91`+e);let t=`https://wa.me/${e}?text=${encodeURIComponent(r)}`;return window.open(t,`_blank`),!0}else if(e.mode===`MODE2_API`)return console.log(`Mode 2: Sending checkout message via backend API...`),!0;return!1};export{n as t};