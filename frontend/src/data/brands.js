import zaraLogo from "../../data/brands/zara.png";
import forever21Logo from "../../data/brands/forever 21.png";
import pumaLogo from "../../data/brands/puma.png";
import levisLogo from "../../data/brands/levi's.png";
import tommyHilfigerLogo from "../../data/brands/Tommy hilfiger.png";
import fabindiaLogo from "../../data/brands/fabindia.png";
import bibaLogo from "../../data/brands/biba.png";
import manyavarLogo from "../../data/brands/manyavar.png";
import allenSollyLogo from "../../data/brands/allen solly.png";
import pantaloonsLogo from "../../data/brands/pantaloons.png";

export const brands = [
  {
    id: 1,
    name: "Zara",
    logo: zaraLogo,
  },
  {
    id: 2,
    name: "Forever 21",
    logo: forever21Logo,
  },
  {
    id: 3,
    name: "Puma",
    logo: pumaLogo,
  },
  {
    id: 4,
    name: "Levi's",
    logo: levisLogo,
  },
  {
    id: 5,
    name: "Tommy Hilfiger",
    logo: tommyHilfigerLogo,
  },
  {
    id: 6,
    name: "Fabindia",
    logo: fabindiaLogo,
  },
  {
    id: 7,
    name: "Biba",
    logo: bibaLogo,
  },
  {
    id: 8,
    name: "Manyavar",
    logo: manyavarLogo,
  },
  {
    id: 9,
    name: "Allen Solly",
    logo: allenSollyLogo,
  },
  {
    id: 10,
    name: "Pantaloons",
    logo: pantaloonsLogo,
  },
];

export const getBrandById = (id) => brands.find((b) => b.id === parseInt(id));
