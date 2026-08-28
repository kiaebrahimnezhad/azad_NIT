// src/components/Footer.tsx
import { FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer = () => (
  <footer className="bg-blue-100 text-blue-800 mt-12">
    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
      <span className="font-bold text-lg">ارتباط با ما:</span>

      <div className="flex items-center space-x-6 mt-4 md:mt-0">
        <span className="flex items-center space-x-2">
          <FaPhone /> <span>09150603021</span>
          <FaPhone /> <span>09113196626</span>
        </span>

        <span className="flex items-center space-x-2">
          <FaEnvelope /> <span>mahdiramezanifarkhani@gmail.com</span>
          <FaEnvelope /> <span>kiarashebi.83.nasest@gmail.com</span>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
