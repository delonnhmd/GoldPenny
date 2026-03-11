const nowIso = new Date().toISOString();

// Central ad inventory source.
// Add future ads below by copying an existing object and updating only the fields you need.
// Category is manual only: do not infer from URL.
export const adInventory = [
  {
    id: "badcreditloans-728",
    title: "Bad Credit Loans Leaderboard",
    category: "finance",
    type: "html",
    size: "728x90",
    trackingUrl: "https://badcreditloans.pxf.io/c/7021230/1478650/17331",
    htmlCode: `<a rel="sponsored"
   href="https://badcreditloans.pxf.io/c/7021230/1478650/17331" target="_top" id="1478650">
<img src="//a.impactradius-go.com/display-ad/17331-1478650" border="0" alt="Bad Credit Loans" width="728" height="90"/></a>
<img height="0" width="0" src="https://imp.pxf.io/i/7021230/1478650/17331" style="position:absolute;visibility:hidden;" border="0" />`,
    imageUrl: "",
    allowedPages: ["homepage", "blog", "loan"],
    enabled: true,
    priority: 10,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "stockmarketguides-video",
    title: "Stock Market Guides Video",
    category: "business_software",
    type: "html",
    size: "250x250",
    trackingUrl: "https://stockmarketguides.sjv.io/c/7021230/1863418/20465",
    htmlCode: `<span id="1863418">
<video width="250" height="250" style="cursor:pointer"
poster="//a.impactradius-go.com/display-clicktoplayimage/1863418.jpeg"
onclick="if(!this.playClicked){this.play();this.setAttribute('controls',true);this.playClicked=true;}">
<source src="//a.impactradius-go.com/display-ad/20465-1863418">
<img src="//a.impactradius-go.com/display-clicktoplayimage/1863418.jpeg" style="border:none;height:100%;width:100%;object-fit:contain">
</video>
<div style="width:250px;text-align:center">
<a rel="sponsored" href="javascript:window.open(decodeURIComponent('https%3A%2F%2Fstockmarketguides.sjv.io%2Fc%2F7021230%2F1863418%2F20465'),'_blank');void(0);">
Click here
</a>
</div>
</span>
<img height="0" width="0" src="https://imp.pxf.io/i/7021230/1863418/20465" style="position:absolute;visibility:hidden;" border="0" />`,
    imageUrl: "",
    allowedPages: ["blog", "market_blog"],
    enabled: true,
    priority: 8,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "united-miles-160x600",
    title: "United MileagePlus Points",
    category: "lifestyle",
    type: "html",
    size: "160x600",
    trackingUrl: "https://united.elfm.net/c/7021230/517827/4704",
    htmlCode: `<a rel="sponsored"
href="https://united.elfm.net/c/7021230/517827/4704"
target="_top"
id="517827">
<img src="//a.impactradius-go.com/display-ad/4704-517827"
border="0"
alt="United MileagePlus"
width="160"
height="600"/>
</a>
<img height="0"
width="0"
src="https://united.elfm.net/i/7021230/517827/4704"
style="position:absolute;visibility:hidden;"
border="0" />`,
    imageUrl: "",
    allowedPages: ["blog"],
    enabled: true,
    priority: 5,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "eightcap-trading-728",
    title: "Eightcap Day Trader Challenges",
    category: "trading",
    type: "html",
    size: "728x90",
    trackingUrl: "https://challenges.eightcap.com/day-trader-challenges/?campaign_id=1&ref_id=1259&creative_Id=23",
    htmlCode: `<a href="https://challenges.eightcap.com/day-trader-challenges/?campaign_id=1&ref_id=1259&creative_Id=23" target="_blank">
                <img
                    src="https://partners.challenges.eightcap.com/serve/1259/IRoHNkHzwEPo"
                    width="728"
                    height="90"
                    alt="Banner Creative"
                  />
              </a>`,
    imageUrl: "",
    allowedPages: ["blog", "market_blog"],
    enabled: true,
    priority: 9,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];
