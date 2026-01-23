import React from 'react';
// Image source: frontend/src/assets/images/footer-bg.png
// Replace this file to change footer background without touching code
import footerBg from '../assets/images/footer-bg.png';

const Footer = () => {
  const footerConfig = {
    name: 'Garbage Management System',
    email: 'sanjaycs483@gmail.com',
    description: 'Efficient waste management for cleaner communities',
    year: new Date().getFullYear(),
  };

  return (
    <footer
      className="bg-darker border-t border-gray-700 mt-auto"
      style={{
        backgroundImage: `url(${footerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="bg-black bg-opacity-70">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Project Info */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                {footerConfig.name}
              </h3>
              <p className="text-gray-400 text-sm">
                {footerConfig.description}
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-md font-medium text-white mb-2">Contact</h4>
              <p className="text-gray-400 text-sm">
                Email: {footerConfig.email}
              </p>
            </div>

            {/* Copyright */}
            <div>
              <h4 className="text-md font-medium text-white mb-2">About</h4>
              <p className="text-gray-400 text-sm">
                © {footerConfig.year} {footerConfig.name}. All rights reserved.
              </p>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-xs">
              Built By Sanjay C with React & Node.js for efficient waste management
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;