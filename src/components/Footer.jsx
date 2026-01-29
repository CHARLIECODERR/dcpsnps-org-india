//  social links array
const socialLinks = [
  { icon: "fab fa-facebook-f", label: "Facebook", href: "https://www.facebook.com/dcpsnps?mibextid=ZbWKwL" },
  { icon: "fab fa-twitter", label: "Twitter", href: "https://x.com/DcpsEmployees?t=BwyC5HZs2lcvQwi1iC2ZxQ&s=08" },
  { icon: "fab fa-youtube", label: "YouTube", href: "https://youtube.com/@dcpsemployessfoundation?si=xWFdcH8MLmhxb2LY" },
  { icon: "fas fa-envelope", label: "Email", href: "#" },
];

const Footer = () => (
  <footer
    style={{ backgroundColor: "#23272f" }}
    className="w-full pt-10 pb-4 px-6 md:px-10"
  >
    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-8 border-b border-white border-opacity-20">
      {/* Organization */}
      <div>
        <h3 className="text-white text-lg font-bold mb-3">DCPS Employees Foundation</h3>
        <p className="text-gray-200/80 mb-4 text-sm">
          Non-Governmental<br />&amp; Nonprofit Organization.
        </p>
        <div className="flex space-x-3 mt-2">
          {socialLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              className="bg-white/20 hover:bg-orange-500 transition-colors rounded-full px-1 py-0 text-white text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className={link.icon}></i>
            </a>
          ))}
        </div>
      </div>
      {/* About */}
      <div>
        <h4 className="text-white text-base font-semibold mb-3">About</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">About Us</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Features</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">News</a></li>
        </ul>
      </div>
      {/* Our Initiatives */}
      <div>
        <h4 className="text-white text-base font-semibold mb-3">Our Initiatives</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Education Programs</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Community Outreach</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Employee Support Services</a></li>
        </ul>
      </div>
      {/* Our Organization */}
      <div>
        <h4 className="text-white text-base font-semibold mb-3">Our Organization</h4>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Home</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">About us</a></li>
          <li><a href="#" className="text-gray-200 hover:text-orange-500 transition">Contact</a></li>
        </ul>
      </div>
    </div>
    {/* Copyright */}
    <div className="max-w-6xl mx-auto pt-4 flex justify-center text-xs text-gray-300">
      © dcpsnps. All rights reserved
    </div>
  </footer>
);

export default Footer;
