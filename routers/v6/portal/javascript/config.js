Config({
    "n-n": "شبكة ",
    "network-name": " الصبري نت ",
    "network-title": "     الصبري   ",
    "service-number": " 773328457  ",
	    "net-name-en": " ALSABRY   NET ",

 "login-type": "user",
	// "login-type": "passwordAsUser",
	// "login-type": "both",
    "news-line": "...:::: اهلاً بكم على شبكة    اللاسلكية .",
"input-type": "text",

//  "input-type": "tel",    
"input-autocomplete": "on",

    "input-rm-white-spaces": 1,
    "input-to-lower": 1,
    "input-to-upper": 0,
    "input-to-arabic-numbers": 0,
    "input-only-numbers": 0,
    "input-no-numbers": 0,
    "input-only-alphanumeric": 0,
    "input-to-text-type-when": 0,
    "enable-hot-cookie": 1,
    "enable-hot-blocker": 1, //<--- غيرها إلى 0 لإيقاف حظر تخمين الكروت (يمكن التحكم من لوحة التحكم أيضاً)
    "clear-router-cookie": 1,
    "clear-hot-cookie": 1,
    "block-time": 1,
    "try-count": 7,
    "warn-when": 5,
    "warn-message": "تحذير !! عدد محاولاتك الخاطئة اصبح {{tryCounter}} محاولات, عدد المحاولات المسموح بها هي {{tryCount}} محاولات فقط, عدد محاولاتك المتبقية {{restTryCount}} محاولات, سيتم حظرك لمدة {{blockTime}} دقائق اذا تجاوزت العدد المسموح للمحاولات",
    "price-button": true,
    "sell-point-button": true,
    "app-store-status-button": true,
    "show-date-field": true,
    "loan-button": true,
    "enable-break-button": 0, //<--- غيرها إلى 1 لتفعيل زر الاستراحة من config.js بدلاً من لوحة التحكم
    "enable-live-stream": 0, //<--- غيرها إلى 1 لتفعيل زر البث المباشر من config.js بدلاً من لوحة التحكم
    "redirect-to-esterahah": "http://20.20.20.20", //<---إذا عندك إستراحة اكتب او الصق الرابط داخل علامتين التنصيص الذي قبل هذه العلامتين
   "redirect-to-mobasher": "http://20.20.20.20", //<---إذا عندك بث مباشر اكتب او الصق الرابط داخل علامتين التنصيص الذي قبل هذه العلامتين
  "redirect-to-panel": "http://50.50.0.22:8090", //<---عنوان لوحة التحكم المحلية (عدّله لعنوان جهازك على الشبكة)
  //  "app-store-base-url": "http://10.10.10.10", // <---إذا عندك متجر تطبيقات اكتب او الصق الرابط داخل علامتين التنصيص الذي قبل  هذه العلامتين
  // الأسعار ونقاط البيع تُدار الآن من لوحة التحكم المحلية (data/profiles.json و data/points.json)
  "profiles": [],

    "sell-points": []
})
