import Header from '../components/Header';
import Footer from '../components/Footer';
// Image source: frontend/src/assets/images/citizen-banner.png
// Replace this file to change citizen banner without touching code
import citizenBanner from '../assets/images/citizen-banner.png';

const CitizenLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      {/* Global Header */}
      <Header />

      {/* Citizen Banner */}
      <div className="relative">
        <img
          src={citizenBanner}
          alt="Citizen Portal Banner"
          className="w-full h-32 md:h-40 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Citizen Portal</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default CitizenLayout;