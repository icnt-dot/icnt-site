# ICNT — GitHub Pages տեղադրման ուղեցույց

Այս փաթեթը պարունակում է կայքի պատրաստ HTML, CSS, JavaScript ֆայլերը և նկարները։
Node.js, npm, սերվեր կամ կոմպիլյացիա պետք չեն։

## Նախքան բեռնելը

GitHub Pages-ի սովորական հրապարակումը հանրային է, նույնիսկ եթե ռեպոզիտորիան private է։
Եթե Pages-ն արդեն միացված է ընտրված ճյուղի համար, ֆայլերը commit անելուց հետո կայքը կարող է ինքնաբերաբար թարմացվել։

## Տեղադրում GitHub-ի կայքից

1. Բացեք ZIP-ը ձեր համակարգչում (Windows-ում՝ Extract All)։
2. Բացեք https://github.com/icnt-dot/icnt-site ։
3. Նախ պահուստավորեք հին տարբերակը՝ Code → Download ZIP։
4. Ընտրեք Add file → Upload files։
5. Քաշեք բացված փաթեթի ԲՈՎԱՆԴԱԿՈՒԹՅՈՒՆԸ՝ բոլոր .html ֆայլերը, assets պանակը և .nojekyll ֆայլը։
   ZIP-ը կամ փաթեթը պարունակող արտաքին պանակը մի բեռնեք որպես մեկ ֆայլ/պանակ։
   index.html-ը պետք է անմիջապես ռեպոզիտորիայի գլխավոր մակարդակում լինի։
6. Հաստատեք հին index.html-ի փոխարինումը և ընտրեք Commit changes։
7. Երբ պատրաստ եք հրապարակել՝ Settings → Pages → Build and deployment։
   Source՝ Deploy from a branch։ Branch՝ main (կամ ձեր օգտագործվող հիմնական ճյուղը)։ Folder՝ /(root)։ Save։
8. Հրապարակման վիճակը դիտեք Actions բաժնում։ Ավարտից հետո Settings → Pages → Visit site։

## Դոմենը

Փաթեթում պահպանված է հին աղբյուրի CNAME ֆայլը՝ icnt-ichph.com արժեքով։
Եթե ցանկանում եք պահել այդ դոմենը, պահպանեք CNAME-ը և Pages → Custom domain կարգավորումը։
Դոմենը պետք է նաև DNS-ով ճիշտ միացված լինի GitHub Pages-ին։
Եթե ուզում եք օգտագործել միայն github.io հասցեն՝ մի բեռնեք CNAME-ը, հեռացրեք հին CNAME-ը, եթե կա,
և դատարկեք Settings → Pages → Custom domain դաշտը։
Առանց հատուկ դոմենի սպասվող հասցեն է https://icnt-dot.github.io/icnt-site/ ։

## Արագ ստուգում

- Բացեք գլխավոր էջը։
- Փոխարկեք ՀԱՅ / EN լեզուները և բացեք սարքավորման էջ։
- Ստուգեք սարքերի նկարները, մեծացված դիտումը, որոնումն ու զտիչները։
- Փորձեք երկու YouTube տեսանյութերի կոճակները։
- Եթե երևում է հին տարբերակը՝ Windows-ում սեղմեք Ctrl+F5։

## Սովորական խնդիրներ

404 — ստուգեք, որ index.html-ը ճիշտ ճյուղի /(root) մակարդակում է, ոչ արտաքին պանակի մեջ։
Չկան նկարներ/ոճերը — ստուգեք, որ assets պանակն ամբողջությամբ բեռնված է՝ ենթապանակներով։
Հրապարակումը ձախողվել է — բացեք Actions-ի վերջին Pages գործողությունը և կարդացեք սխալը։

## Պաշտոնական հրահանգներ

https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
