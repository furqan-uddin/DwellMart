import clothingCategory from "../../data/categories/clothing.png";
import shoesCategory from "../../data/categories/shoes.png";
import bagsCategory from "../../data/categories/bags.png";
import jeweleryCategory from "../../data/categories/jewelery.png";
import accessoriesCategory from "../../data/categories/accessories.png";
import athleticsCategory from "../../data/categories/Athletics.png";

export const categories = [
  {
    id: 1,
    name: "Clothing",
    description: "All apparel items (Tops, Bottoms, Dresses, Outerwear)",
    image: clothingCategory,
  },
  {
    id: 2,
    name: "Footwear",
    description: "All shoes and boots",
    image: shoesCategory,
  },
  {
    id: 3,
    name: "Bags",
    description: "Handbags and crossbody bags",
    image: bagsCategory,
  },
  {
    id: 4,
    name: "Jewelry",
    description: "Necklaces and watches",
    image: jeweleryCategory,
  },
  {
    id: 5,
    name: "Accessories",
    description: "Sunglasses, belts, scarves",
    image: accessoriesCategory,
  },
  {
    id: 6,
    name: "Athletic",
    description: "Sport-specific clothing and shoes",
    image: athleticsCategory,
  },
];
