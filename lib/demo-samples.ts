// Built-in datasets for every demo, in three sizes — so each page opens
// with a working visual and a visitor can feel how it scales before
// uploading their own data.

export type SamplePreset = {
  id: "simple" | "medium" | "complex";
  label: string;
  fileName: string;
  csv: string;
};

/* ------------------------------- Sankey -------------------------------- */

export const SANKEY_SAMPLES: SamplePreset[] = [
  {
    id: "simple",
    label: "Simple",
    fileName: "sample-signup-funnel.csv",
    csv: `source,target,value
Visitors,Signed Up,620
Visitors,Left,1380
Signed Up,Activated,410
Signed Up,Dormant,210
Activated,Paid Plan,150
Activated,Free Plan,260
`,
  },
  {
    id: "medium",
    label: "Medium",
    fileName: "sample-acquisition-funnel.csv",
    csv: `source,target,value
Organic Search,Landing Page,4200
Paid Ads,Landing Page,2600
Social,Landing Page,1800
Email,Landing Page,1200
Landing Page,Product Page,6500
Landing Page,Bounced,3300
Product Page,Add to Cart,2900
Product Page,Exited,3600
Add to Cart,Checkout,1950
Add to Cart,Cart Abandoned,950
Checkout,Purchase,1520
Checkout,Payment Failed,430
`,
  },
  {
    id: "complex",
    label: "Complex",
    fileName: "sample-marketing-attribution.csv",
    csv: `source,target,value
Paid Search,Home Page,1800
Paid Search,Product Page,2200
Organic,Home Page,2600
Organic,Blog,1900
Organic,Product Page,1500
Social,Home Page,1400
Social,Blog,1200
Email,Product Page,1600
Email,Home Page,700
Referral,Product Page,900
Referral,Home Page,600
Home Page,Engaged,3100
Home Page,Skimmed,2400
Home Page,Bounced,1600
Product Page,Engaged,3800
Product Page,Skimmed,1600
Product Page,Bounced,800
Blog,Engaged,1500
Blog,Skimmed,800
Blog,Bounced,800
Engaged,Lead,4200
Engaged,Trial,3100
Engaged,Lost,1100
Skimmed,Lead,1800
Skimmed,Lost,3000
Lead,Trial,2900
Lead,Lost,3100
Trial,Customer,3600
Trial,Churned,2400
`,
  },
];

/* ------------------------------ Network -------------------------------- */

export const NETWORK_SAMPLES: SamplePreset[] = [
  {
    id: "simple",
    label: "Simple",
    fileName: "sample-small-network.csv",
    csv: `source,target,value
Alice,Bob,3
Alice,Carol,2
Bob,Carol,4
Bob,Dave,2
Carol,Eve,3
Dave,Eve,2
Eve,Frank,3
Frank,Alice,1
`,
  },
  {
    id: "medium",
    label: "Medium",
    fileName: "sample-team-collaboration.csv",
    csv: `source,target,value
Design,Engineering,8
Design,Product,6
Design,Marketing,2
Engineering,Product,9
Engineering,QA,7
Engineering,Data,6
Engineering,Support,4
Product,Marketing,5
Product,Data,5
Product,Finance,2
Product,Leadership,4
Marketing,Sales,8
Marketing,Data,3
Sales,Support,6
Sales,Finance,5
QA,Product,4
Support,Product,3
Data,Leadership,3
Leadership,Engineering,3
Leadership,Design,2
`,
  },
  {
    id: "complex",
    label: "Complex",
    fileName: "sample-microservices.csv",
    csv: `source,target,value
API Gateway,Auth Service,9
API Gateway,User Service,8
API Gateway,Catalog Service,7
API Gateway,Search Service,6
API Gateway,Cart Service,7
API Gateway,Order Service,8
API Gateway,Review Service,4
Auth Service,User Service,6
Auth Service,Cache,5
Auth Service,Database,4
User Service,Database,7
User Service,Cache,5
User Service,Notification Service,3
Billing Service,Payment Service,8
Billing Service,User Service,4
Billing Service,Database,5
Payment Service,Message Queue,6
Payment Service,Notification Service,4
Payment Service,Database,5
Order Service,Inventory Service,7
Order Service,Payment Service,6
Order Service,Shipping Service,5
Order Service,Database,6
Order Service,Message Queue,4
Inventory Service,Database,6
Inventory Service,Catalog Service,4
Catalog Service,Database,6
Catalog Service,Media Service,5
Catalog Service,Search Service,4
Search Service,Cache,6
Cart Service,Cache,5
Cart Service,Catalog Service,4
Checkout Service,Cart Service,6
Checkout Service,Payment Service,5
Checkout Service,Order Service,6
Checkout Service,Inventory Service,4
Shipping Service,Notification Service,3
Shipping Service,Database,4
Notification Service,Email Worker,5
Notification Service,SMS Worker,4
Notification Service,Message Queue,5
Analytics Service,Database,5
Analytics Service,Message Queue,4
Analytics Service,Metrics Store,6
Recommendation Service,Analytics Service,4
Recommendation Service,Catalog Service,3
Recommendation Service,Cache,4
Review Service,Database,5
Review Service,User Service,3
Media Service,CDN,6
Media Service,Database,4
Logging Service,Message Queue,5
Config Service,Database,3
Admin Console,User Service,4
Admin Console,Catalog Service,3
Admin Console,Order Service,3
Admin Console,Config Service,4
`,
  },
];

/* ------------------------------- Matrix -------------------------------- */

export const MATRIX_SAMPLES: SamplePreset[] = [
  {
    id: "simple",
    label: "Simple",
    fileName: "sample-product-sales.csv",
    csv: `Product,Units Sold,Revenue,Returns
Widget A,1240,18600,42
Widget B,890,15130,55
Widget C,2100,25200,38
Widget D,560,11200,21
Widget E,1450,21750,67
Widget F,980,14700,33
`,
  },
  {
    id: "medium",
    label: "Medium",
    fileName: "sample-regional-revenue.csv",
    csv: `Region,Q1 Revenue,Q2 Revenue,Q3 Revenue,Q4 Revenue,YoY Growth %
North America,428000,456000,489000,531000,14.2
Europe,386000,372000,401000,438000,9.6
Asia Pacific,298000,341000,388000,442000,21.8
Latin America,164000,158000,177000,193000,11.4
Middle East,142000,151000,149000,168000,8.7
Africa,98000,112000,124000,139000,18.3
`,
  },
  {
    id: "complex",
    label: "Complex",
    fileName: "sample-saas-accounts.csv",
    csv: `Account,Plan,MRR,Seats,Active Users,Support Tickets,NPS,Health Score
Northwind Traders,Enterprise,8400,120,98,14,42,78
Contoso Ltd,Pro,2900,45,38,7,55,84
Fabrikam Inc,Enterprise,11200,180,151,22,38,71
Adventure Works,Pro,3400,52,44,9,61,88
Tailspin Toys,Starter,690,12,9,3,48,69
Wingtip Toys,Pro,2600,40,31,11,29,58
Litware Inc,Enterprise,9700,140,118,18,47,80
Proseware Inc,Starter,540,9,7,2,52,72
Coho Vineyard,Pro,3100,48,42,6,67,91
Alpine Ski House,Starter,820,15,11,5,33,61
Blue Yonder,Enterprise,13400,210,174,27,51,83
Graphic Design Co,Pro,2400,36,28,8,44,66
City Power & Light,Enterprise,10100,160,129,20,40,74
Lucerne Publishing,Pro,3600,55,49,5,72,93
Margie's Travel,Starter,610,11,8,4,39,63
Nod Publishers,Pro,2800,42,33,10,35,60
School of Fine Art,Starter,470,8,5,3,58,75
Southridge Video,Pro,3300,50,45,7,64,89
Trey Research,Enterprise,12600,195,168,16,56,86
VanArsdel Ltd,Pro,2500,38,27,13,26,54
Woodgrove Bank,Enterprise,14800,240,205,24,49,82
Fourth Coffee,Starter,720,13,10,6,31,59
`,
  },
];
