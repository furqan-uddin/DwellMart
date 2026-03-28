import { Link } from "react-router-dom";
import { 
  FiFacebook, 
  FiTwitter, 
  FiInstagram, 
  FiYoutube, 
  FiChevronRight
} from "react-icons/fi";
import { motion } from "framer-motion";
import { appLogo } from "../../../../data/logos";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Shop Categories",
      links: [
        { label: "Electronics", path: "/categories?cat=electronics" },
        { label: "Fashion", path: "/categories?cat=fashion" },
        { label: "Beauty & Health", path: "/categories?cat=beauty" },
        { label: "Home & Kitchen", path: "/categories?cat=home" },
        { label: "Toys & Games", path: "/categories?cat=toys" },
      ],
    },
    {
      title: "Customer Service",
      links: [
        { label: "Contact Us", path: "/contact" },
        { label: "Track Your Order", path: "/orders" },
        { label: "Returns & Exchanges", path: "/returns" },
        { label: "Shipping Policy", path: "/shipping" },
        { label: "FAQs", path: "/faq" },
      ],
    },
    {
      title: "Quick Links",
      links: [
        { label: "About Dwell Mart", path: "/about" },
        { label: "Vendor Registration", path: "/vendor/register" },
        { label: "Terms & Conditions", path: "/terms" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Become a Partner", path: "/partner" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Identity */}
          <div className="space-y-6">
            <Link to="/home" className="flex items-center gap-2">
              {appLogo.src ? (
                <img src={appLogo.src} alt={appLogo.alt} className="h-28 w-auto object-contain brightness-0 invert -ml-4" />
              ) : (
                <span className="text-2xl font-black text-white">Dwell Mart</span>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Your one-stop destination for curated products from trusted vendors nationwide. We prioritize quality, security, and customer delight in every transaction.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: FiFacebook, link: "#" },
                { icon: FiTwitter, link: "#" },
                { icon: FiInstagram, link: "#" },
                { icon: FiYoutube, link: "#" },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.link}
                  whileHover={{ y: -5, color: "#7C3AED" }}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-colors"
                >
                  <social.icon className="text-lg" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Dynamic Sections */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h4 className="text-white font-bold text-lg tracking-wide uppercase text-sm">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      className="group flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      <FiChevronRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-8 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} <span className="text-white font-semibold">Dwell Mart</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4 opacity-50">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
