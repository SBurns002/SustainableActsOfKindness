import React from 'react';
import { MapPin, Users, Leaf, Heart, Target, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const features = [
    {
      icon: MapPin,
      title: "Interactive Mapping",
      description: "Discover environmental cleanup events, tree planting initiatives, and community gardens in your area through our intuitive map interface."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join thousands of volunteers making a real difference in their communities through organized environmental action."
    },
    {
      icon: Leaf,
      title: "Environmental Impact",
      description: "Track and participate in activities that directly improve air quality, restore habitats, and create sustainable communities."
    },
    {
      icon: Heart,
      title: "Acts of Kindness",
      description: "Every environmental action is an act of kindness toward our planet and future generations."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Trees Planted" },
    { number: "500+", label: "Cleanup Events" },
    { number: "25,000+", label: "Volunteers" },
    { number: "150+", label: "Communities" }
  ];

  const impactAreas = [
    {
      title: "Environmental Cleanup",
      description: "Removing pollution from waterways, parks, and urban areas to restore natural ecosystems.",
      color: "bg-blue-500"
    },
    {
      title: "Tree Planting",
      description: "Increasing urban canopy coverage and restoring forests to combat climate change.",
      color: "bg-green-500"
    },
    {
      title: "Community Gardens",
      description: "Creating sustainable food sources and green spaces that bring communities together.",
      color: "bg-amber-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-full">
                <Globe className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">About Sustainable Acts of Kindness</h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              Connecting communities through environmental action. Our platform empowers individuals to discover, 
              participate in, and organize meaningful environmental initiatives that create lasting positive impact.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            To create a world where environmental stewardship is accessible, engaging, and impactful. 
            We believe that small acts of kindness toward our planet can create ripple effects that 
            transform communities and inspire lasting change.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Impact So Far</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Areas */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Areas of Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {impactAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className={`h-2 ${area.color}`}></div>
                <div className="p-8">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">{area.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-12 mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">1</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Discover Events</h4>
              <p className="text-gray-600">Browse our interactive map to find environmental events near you.</p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">2</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Join & Participate</h4>
              <p className="text-gray-600">Sign up for events and connect with like-minded community members.</p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">3</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Make Impact</h4>
              <p className="text-gray-600">Take action and see the positive environmental impact you're creating.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Ready to Make a Difference?</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of environmental stewards and start making a positive impact in your area today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              Explore Events
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-4 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors duration-200"
            >
              Join Our Community
            </Link>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-gray-900 text-white py-20 rounded-2xl mb-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold mb-6">Our Values</h3>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                The principles that guide our mission and community
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Target className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">Purpose-Driven Action</h4>
                <p className="text-gray-300">Every initiative we support has measurable environmental impact and community benefit.</p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">Inclusive Community</h4>
                <p className="text-gray-300">We welcome everyone, regardless of experience level, to participate in environmental stewardship.</p>
              </div>
              <div className="text-center">
                <Globe className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                <h4 className="text-xl font-semibold mb-4">Global Thinking, Local Action</h4>
                <p className="text-gray-300">We address global environmental challenges through coordinated local community action.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;