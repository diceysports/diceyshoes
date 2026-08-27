export const products=[
{slug:'cactus-jack-air-force-1',brand:'Nike',name:'Travis Scott × Air Force 1 “Cactus Jack”',price:160,category:'Sneakers',gender:'Men',image:'https://image.goat.com/transform/v1/attachments/product_template_additional_pictures/images/079/492/676/original/545834_01.jpg.jpeg?width=750',sizes:['7','8','9','10','11','12'],status:'In Stock'},
{slug:'jordan-1-low-mocha',brand:'Jordan',name:'Travis Scott × Air Jordan 1 Low “Mocha”',price:1730.72,category:'Sneakers',gender:'Men',image:'https://cdn.shopify.com/s/files/1/0603/3031/1875/files/main-square_1fc87fea-5cc2-4c55-b9ce-88148fb9a1ba.jpg?v=1706609708',sizes:['7','8','9','10','11'],status:'Low Stock'},
{slug:'samba-og-white-black-gum',brand:'Adidas',name:'Samba OG “White Black Gum”',price:100,category:'Sneakers',gender:'Unisex',image:'https://image.goat.com/transform/v1/attachments/product_template_additional_pictures/images/070/577/109/original/437050_01.jpg.jpeg?width=750',sizes:['5','6','7','8','9','10','11','12'],status:'In Stock'},
{slug:'yeezy-zebra',brand:'Yeezy',name:'Yeezy Boost 350 V2 “Zebra”',price:230,category:'Sneakers',gender:'Unisex',image:'https://image.goat.com/transform/v1/attachments/product_template_additional_pictures/images/089/144/518/original/1213726_01.jpg.jpeg?width=750',sizes:['7','8','9','10','11','12'],status:'In Stock'},
{slug:'lv-trainer',brand:'Louis Vuitton',name:'LV Trainer Sneaker',price:1196.47,category:'Luxury',gender:'Men',image:'https://ca.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton--lv-trainer-sneaker--AQ9U3APC91_PM2_Front%20view.jpg',sizes:['7','8','9','10','11'],status:'In Stock'},
{slug:'balenciaga-3xl-mule',brand:'Balenciaga',name:'3XL Mule',price:1095,category:'Luxury',gender:'Unisex',image:'https://media.balenciaga.cn/m/463e4640347ad453/Medium-742682W3XL11010_F.jpg?v=1',sizes:['6','7','8','9','10','11'],status:'Low Stock'},
{slug:'versace-chain-reaction',brand:'Versace',name:'Chain Reaction Sneakers',price:1045,category:'Luxury',gender:'Men',image:'https://cdn-images.farfetch-contents.com/13/54/12/20/13541220_21550107_480.jpg',sizes:['7','8','9','10','11'],status:'In Stock'},
{slug:'louboutin-fun-louis',brand:'Christian Louboutin',name:'Fun Louis Junior Leather Sneakers',price:925,category:'Luxury',gender:'Men',image:'https://img.mytheresa.com/512/512/66/jpeg/catalog/product/71/P00830486.jpg',sizes:['7','8','9','10','11'],status:'In Stock'}
];
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n%1?2:0}).format(n);
export const releases=[
{date:'Aug 29',brand:'Jordan',name:'AWAKE × Air Jordan 6 “Blueberry”',price:230},
{date:'Aug 30',brand:'Nike',name:'Foamposite Mash-Up',price:170},
{date:'Sep 02',brand:'Jordan',name:'University Red / Pink',price:185},
{date:'Sep 05',brand:'Jordan',name:'Tour Yellow',price:220},
{date:'Sep 26',brand:'Jordan',name:'Challenge Red',price:205}
];