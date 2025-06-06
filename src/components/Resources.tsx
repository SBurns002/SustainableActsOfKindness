import React, { useState, useMemo } from 'react';
import { Search, Filter, ExternalLink, Download, BookOpen, Leaf, Recycle, Droplets, Home, Car, Utensils, X } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'external' | 'pdf';
  url: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime?: string;
}

const Resources: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const resources: Resource[] = [
    // External Resources
    {
      id: 'ext-1',
      title: 'EPA Environmental Protection Guide',
      description: 'Comprehensive guide from the Environmental Protection Agency covering air quality, water conservation, and waste reduction strategies for communities and individuals.',
      category: 'general',
      type: 'external',
      url: 'https://www.epa.gov/environmental-topics',
      tags: ['government', 'comprehensive', 'policy'],
      difficulty: 'intermediate',
      readTime: '45 min'
    },
    {
      id: 'ext-2',
      title: 'National Geographic Climate Action',
      description: 'National Geographic\'s climate action hub featuring the latest research, solutions, and stories about climate change and environmental conservation efforts worldwide.',
      category: 'climate',
      type: 'external',
      url: 'https://www.nationalgeographic.com/environment/climate-change/',
      tags: ['climate', 'research', 'global'],
      difficulty: 'beginner',
      readTime: '30 min'
    },
    {
      id: 'ext-3',
      title: 'Green Building Council Resources',
      description: 'U.S. Green Building Council\'s comprehensive resource library for sustainable building practices, LEED certification, and green construction techniques.',
      category: 'energy',
      type: 'external',
      url: 'https://www.usgbc.org/resources',
      tags: ['building', 'certification', 'construction'],
      difficulty: 'advanced',
      readTime: '60 min'
    },
    {
      id: 'ext-4',
      title: 'Ocean Conservancy Action Center',
      description: 'Leading ocean conservation organization providing resources on marine protection, plastic pollution solutions, and coastal cleanup best practices.',
      category: 'water',
      type: 'external',
      url: 'https://oceanconservancy.org/take-action/',
      tags: ['ocean', 'marine', 'pollution'],
      difficulty: 'beginner',
      readTime: '25 min'
    },
    {
      id: 'ext-5',
      title: 'Zero Waste International Alliance',
      description: 'Global network promoting zero waste principles with practical guides for waste reduction, circular economy practices, and sustainable consumption patterns.',
      category: 'waste',
      type: 'external',
      url: 'https://zwia.org/zero-waste-definition/',
      tags: ['zero-waste', 'circular-economy', 'reduction'],
      difficulty: 'intermediate',
      readTime: '40 min'
    },
    // PDF Articles
    {
      id: 'pdf-1',
      title: 'Complete Guide to Home Composting',
      description: 'Step-by-step tutorial for setting up and maintaining a home composting system, including troubleshooting common problems and maximizing nutrient output.',
      category: 'waste',
      type: 'pdf',
      url: '/resources/home-composting-guide.pdf',
      tags: ['composting', 'organic', 'tutorial'],
      difficulty: 'beginner',
      readTime: '20 min'
    },
    {
      id: 'pdf-2',
      title: 'Renewable Energy Systems for Homeowners',
      description: 'Comprehensive overview of solar, wind, and geothermal energy options for residential properties, including cost analysis and installation considerations.',
      category: 'energy',
      type: 'pdf',
      url: '/resources/renewable-energy-homeowners.pdf',
      tags: ['solar', 'renewable', 'installation'],
      difficulty: 'advanced',
      readTime: '35 min'
    },
    {
      id: 'pdf-3',
      title: 'Water Conservation Techniques Manual',
      description: 'Practical strategies for reducing water consumption at home and in gardens, featuring rainwater harvesting, greywater systems, and drought-resistant landscaping.',
      category: 'water',
      type: 'pdf',
      url: '/resources/water-conservation-manual.pdf',
      tags: ['conservation', 'rainwater', 'landscaping'],
      difficulty: 'intermediate',
      readTime: '25 min'
    },
    {
      id: 'pdf-4',
      title: 'Sustainable Transportation Planning',
      description: 'Guide to reducing transportation carbon footprint through electric vehicles, public transit optimization, cycling infrastructure, and remote work strategies.',
      category: 'transportation',
      type: 'pdf',
      url: '/resources/sustainable-transportation.pdf',
      tags: ['electric-vehicles', 'public-transit', 'cycling'],
      difficulty: 'intermediate',
      readTime: '30 min'
    },
    {
      id: 'pdf-5',
      title: 'Organic Gardening and Permaculture Basics',
      description: 'Introduction to sustainable gardening practices, soil health management, companion planting, and creating self-sustaining garden ecosystems.',
      category: 'food',
      type: 'pdf',
      url: '/resources/organic-gardening-permaculture.pdf',
      tags: ['gardening', 'permaculture', 'organic'],
      difficulty: 'beginner',
      readTime: '40 min'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories', icon: BookOpen },
    { value: 'general', label: 'General Environment', icon: Leaf },
    { value: 'waste', label: 'Waste & Recycling', icon: Recycle },
    { value: 'water', label: 'Water Conservation', icon: Droplets },
    { value: 'energy', label: 'Energy & Building', icon: Home },
    { value: 'transportation', label: 'Transportation', icon: Car },
    { value: 'food', label: 'Food & Agriculture', icon: Utensils },
    { value: 'climate', label: 'Climate Action', icon: Leaf }
  ];

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
    });
  }, [searchTerm, selectedCategory, selectedType, selectedDifficulty, resources]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedDifficulty('all');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData ? categoryData.icon : BookOpen;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-4 rounded-full">
                <BookOpen className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">Sustainability Resources</h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              Discover comprehensive guides, tutorials, and best practices for eco-friendly living. 
              From beginner tips to advanced techniques, find the resources you need to make a positive environmental impact.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search resources, guides, and tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="external">External Links</option>
                <option value="pdf">PDF Articles</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Active filters:</span>
                {searchTerm && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {categories.find(c => c.value === selectedCategory)?.label}
                  </span>
                )}
                {selectedType !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {selectedType === 'external' ? 'External Links' : 'PDF Articles'}
                  </span>
                )}
                {selectedDifficulty !== 'all' && (
                  <span className={`px-2 py-1 rounded capitalize ${getDifficultyColor(selectedDifficulty)}`}>
                    {selectedDifficulty}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredResources.length} of {resources.length} resources
          </p>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
            <button
              onClick={clearFilters}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => {
              const CategoryIcon = getCategoryIcon(resource.category);
              
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <CategoryIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-2">
                          {resource.type === 'external' ? (
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Download className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                            {resource.difficulty}
                          </span>
                        </div>
                      </div>
                      {resource.readTime && (
                        <span className="text-xs text-gray-500">{resource.readTime}</span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      {resource.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {resource.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{resource.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        resource.type === 'external' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {resource.type === 'external' ? 'External Link' : 'PDF Download'}
                      </span>

                      <a
                        href={resource.url}
                        target={resource.type === 'external' ? '_blank' : '_self'}
                        rel={resource.type === 'external' ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        {resource.type === 'external' ? (
                          <>
                            <span>Visit Site</span>
                            <ExternalLink className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Download</span>
                            <Download className="w-4 h-4" />
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-16 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need More Resources?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? We're constantly adding new guides and tutorials. 
              Check back regularly or suggest resources you'd like to see.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Suggest a Resource
              </button>
              <button className="border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                Subscribe to Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;