// This file contains mock GeoJSON data for environmental cleanup areas
// and tree planting events in the continental United States

export const cleanupData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Charles River Cleanup Initiative",
        type: "Water Pollution",
        priority: "high",
        date: "2025-07-05",
        time: "9:00 AM - 3:00 PM",
        location: "Charles River Esplanade, Boston, MA",
        address: "100 Storrow Drive, Boston, MA 02116",
        description: "Urban river cleanup focusing on plastic pollution and industrial runoff in the Charles River.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.12, 42.37],
          [-71.07, 42.37],
          [-71.07, 42.35],
          [-71.12, 42.35],
          [-71.12, 42.37]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Boston Harbor Islands Restoration",
        type: "Mixed Pollution",
        priority: "medium",
        date: "2025-07-15",
        time: "8:30 AM - 4:30 PM",
        location: "Spectacle Island, Boston Harbor",
        address: "Ferry departure from Long Wharf, Boston, MA 02110",
        description: "Marine ecosystem restoration and debris removal around Boston Harbor Islands.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-70.97, 42.33],
          [-70.92, 42.33],
          [-70.92, 42.30],
          [-70.97, 42.30],
          [-70.97, 42.33]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Emerald Necklace Tree Initiative",
        type: "Urban Reforestation",
        priority: "medium",
        date: "2025-07-20",
        time: "10:00 AM - 2:00 PM",
        location: "Franklin Park, Boston, MA",
        address: "1 Franklin Park Rd, Boston, MA 02121",
        description: "Community tree planting event along Boston's historic park system.",
        eventType: "treePlanting",
        trees: 250
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.12, 42.33],
          [-71.09, 42.33],
          [-71.09, 42.31],
          [-71.12, 42.31],
          [-71.12, 42.33]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Cambridge Urban Forest Expansion",
        type: "Street Tree Planting",
        priority: "low",
        date: "2025-08-01",
        time: "9:00 AM - 1:00 PM",
        location: "Cambridge Common, Cambridge, MA",
        address: "Cambridge Common, Cambridge, MA 02138",
        description: "Street tree planting program in Cambridge neighborhoods.",
        eventType: "treePlanting",
        trees: 175
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.13, 42.39],
          [-71.10, 42.39],
          [-71.10, 42.37],
          [-71.13, 42.37],
          [-71.13, 42.39]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Salem Harbor Waterfront Cleanup",
        type: "Marine Pollution",
        priority: "high",
        date: "2025-07-12",
        time: "8:00 AM - 4:00 PM",
        location: "Salem Harbor, Salem, MA",
        address: "Derby Wharf, 174 Derby St, Salem, MA 01970",
        description: "Historic harbor cleanup focusing on marine debris and waterfront restoration in Salem's historic port area.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-70.89, 42.52],
          [-70.86, 42.52],
          [-70.86, 42.50],
          [-70.89, 42.50],
          [-70.89, 42.52]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Forest River Park Tree Planting",
        type: "Urban Reforestation",
        priority: "medium",
        date: "2025-08-10",
        time: "9:30 AM - 2:30 PM",
        location: "Forest River Park, Salem, MA",
        address: "Forest River Park, Salem, MA 01970",
        description: "Native tree planting initiative to restore urban forest canopy in Salem's largest park.",
        eventType: "treePlanting",
        trees: 300
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-70.91, 42.51],
          [-70.88, 42.51],
          [-70.88, 42.49],
          [-70.91, 42.49],
          [-70.91, 42.51]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Attleboro Springs Wetland Restoration",
        type: "Habitat Restoration",
        priority: "high",
        date: "2025-07-26",
        time: "8:30 AM - 3:30 PM",
        location: "Attleboro Springs Wildlife Sanctuary",
        address: "Attleboro Springs Wildlife Sanctuary, North Attleborough, MA 02760",
        description: "Wetland habitat restoration and invasive species removal in the Attleboro Springs area.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.35, 41.98],
          [-71.32, 41.98],
          [-71.32, 41.96],
          [-71.35, 41.96],
          [-71.35, 41.98]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ten Mile River Cleanup",
        type: "Water Pollution",
        priority: "medium",
        date: "2025-08-16",
        time: "9:00 AM - 3:00 PM",
        location: "Ten Mile River, Attleboro, MA",
        address: "Capron Park, 201 County St, Attleboro, MA 02703",
        description: "River cleanup and water quality improvement project along the Ten Mile River in Attleboro.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.30, 41.95],
          [-71.27, 41.95],
          [-71.27, 41.93],
          [-71.30, 41.93],
          [-71.30, 41.95]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Capron Park Community Garden",
        type: "Community Garden",
        date: "2025-07-30",
        time: "10:00 AM - 4:00 PM",
        location: "Capron Park Zoo, Attleboro, MA",
        address: "201 County St, Attleboro, MA 02703",
        description: "Community garden expansion project promoting sustainable urban agriculture and education.",
        eventType: "garden",
        plots: 85
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.295, 41.945],
          [-71.285, 41.945],
          [-71.285, 41.935],
          [-71.295, 41.935],
          [-71.295, 41.945]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Middlesex Fells Reservation Cleanup",
        type: "Forest Restoration",
        priority: "medium",
        date: "2025-08-05",
        time: "8:00 AM - 4:00 PM",
        location: "Middlesex Fells Reservation, Medford, MA",
        address: "4 Woodland Rd, Stoneham, MA 02180",
        description: "Large-scale forest cleanup and trail maintenance in the Middlesex Fells Reservation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.12, 42.46],
          [-71.08, 42.46],
          [-71.08, 42.43],
          [-71.12, 42.43],
          [-71.12, 42.46]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Walden Pond State Reservation",
        type: "Historic Site Restoration",
        priority: "high",
        date: "2025-07-19",
        time: "7:30 AM - 3:30 PM",
        location: "Walden Pond State Reservation, Concord, MA",
        address: "915 Walden St, Concord, MA 01742",
        description: "Environmental restoration of Thoreau's famous Walden Pond and surrounding conservation area.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.34, 42.44],
          [-71.32, 42.44],
          [-71.32, 42.42],
          [-71.34, 42.42],
          [-71.34, 42.44]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Quabbin Reservoir Forest Restoration",
        type: "Watershed Protection",
        priority: "high",
        date: "2025-08-23",
        time: "8:00 AM - 5:00 PM",
        location: "Quabbin Reservoir, Belchertown, MA",
        address: "485 Ware Rd, Belchertown, MA 01007",
        description: "Watershed protection and forest restoration around Massachusetts' largest water supply.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-72.38, 42.33],
          [-72.30, 42.33],
          [-72.30, 42.25],
          [-72.38, 42.25],
          [-72.38, 42.33]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Cape Cod National Seashore Cleanup",
        type: "Coastal Restoration",
        priority: "medium",
        date: "2025-08-09",
        time: "9:00 AM - 4:00 PM",
        location: "Cape Cod National Seashore, Eastham, MA",
        address: "99 Marconi Site Rd, Wellfleet, MA 02667",
        description: "Beach cleanup and dune restoration along Cape Cod's pristine coastline.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-69.97, 41.90],
          [-69.92, 41.90],
          [-69.92, 41.85],
          [-69.97, 41.85],
          [-69.97, 41.90]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mount Greylock State Reservation",
        type: "Mountain Ecosystem Restoration",
        priority: "medium",
        date: "2025-07-27",
        time: "8:30 AM - 4:30 PM",
        location: "Mount Greylock State Reservation, Adams, MA",
        address: "30 Rockwell Rd, Lanesborough, MA 01237",
        description: "High-elevation ecosystem restoration on Massachusetts' highest peak.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.17, 42.64],
          [-73.14, 42.64],
          [-73.14, 42.61],
          [-73.17, 42.61],
          [-73.17, 42.64]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Great Lakes Plastic Pollution",
        type: "Water Pollution",
        priority: "high",
        date: "2025-08-15",
        time: "7:00 AM - 5:00 PM",
        location: "Lake Michigan Shoreline, Chicago, IL",
        address: "North Avenue Beach, Chicago, IL 60614",
        description: "Plastic waste accumulation in the Great Lakes region affecting wildlife and water quality.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-87.5, 45.0],
          [-82.5, 45.0],
          [-82.5, 41.5],
          [-87.5, 41.5],
          [-87.5, 45.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Gulf Coast Oil Spill Residue",
        type: "Oil Pollution",
        priority: "high",
        date: "2025-07-22",
        time: "6:00 AM - 4:00 PM",
        location: "Gulf Shores State Park, Alabama",
        address: "20115 State Hwy 135, Gulf Shores, AL 36542",
        description: "Remaining contamination from historical oil spills requiring remediation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-93.0, 30.0],
          [-88.0, 30.0],
          [-88.0, 28.0],
          [-93.0, 28.0],
          [-93.0, 30.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "New Jersey Industrial Zone",
        type: "Chemical Contamination",
        priority: "medium",
        date: "2025-08-03",
        time: "8:00 AM - 4:00 PM",
        location: "Liberty State Park, Jersey City, NJ",
        address: "200 Morris Pesin Dr, Jersey City, NJ 07305",
        description: "Former industrial sites with soil contamination requiring remediation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.5, 40.2],
          [-74.0, 40.2],
          [-74.0, 39.8],
          [-74.5, 39.8],
          [-74.5, 40.2]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "California Wildfire Aftermath",
        type: "Ash and Debris",
        priority: "medium",
        date: "2025-07-15",
        time: "7:30 AM - 3:30 PM",
        location: "Napa Valley State Park, California",
        address: "3801 St Helena Hwy N, Calistoga, CA 94515",
        description: "Post-wildfire cleanup of ash and debris that could contaminate water sources.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.5, 39.0],
          [-121.5, 39.0],
          [-121.5, 38.0],
          [-122.5, 38.0],
          [-122.5, 39.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Colorado Mining Runoff",
        type: "Heavy Metal Contamination",
        priority: "high",
        date: "2025-08-05",
        time: "8:00 AM - 5:00 PM",
        location: "Rocky Mountain National Park, Colorado",
        address: "1000 US Hwy 36, Estes Park, CO 80517",
        description: "Abandoned mines leaching heavy metals into local water systems.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-107.0, 38.5],
          [-106.0, 38.5],
          [-106.0, 37.5],
          [-107.0, 37.5],
          [-107.0, 38.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Oregon Forest Restoration",
        type: "Deforestation",
        priority: "low",
        date: "2025-07-20",
        time: "9:00 AM - 4:00 PM",
        location: "Mount Hood National Forest, Oregon",
        address: "16400 Champion Way, Sandy, OR 97055",
        description: "Areas requiring reforestation and habitat restoration.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-123.0, 45.0],
          [-122.0, 45.0],
          [-122.0, 44.0],
          [-123.0, 44.0],
          [-123.0, 45.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ohio River Valley Waste Site",
        type: "Industrial Waste",
        priority: "medium",
        date: "2025-07-18",
        time: "8:30 AM - 3:30 PM",
        location: "Shawnee State Park, Ohio",
        address: "4404 State Route 125, West Portsmouth, OH 45663",
        description: "Former industrial waste disposal site requiring containment and cleanup.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-84.5, 39.2],
          [-83.5, 39.2],
          [-83.5, 38.7],
          [-84.5, 38.7],
          [-84.5, 39.2]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Florida Everglades Restoration",
        type: "Habitat Degradation",
        priority: "medium",
        date: "2025-08-01",
        time: "7:00 AM - 3:00 PM",
        location: "Everglades National Park, Florida",
        address: "40001 State Road 9336, Homestead, FL 33034",
        description: "Restoration of natural water flow and removal of invasive species.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-81.5, 26.0],
          [-80.5, 26.0],
          [-80.5, 25.0],
          [-81.5, 25.0],
          [-81.5, 26.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Texas Agricultural Runoff",
        type: "Chemical Fertilizer",
        priority: "low",
        date: "2025-07-10",
        time: "8:00 AM - 2:00 PM",
        location: "White Rock Lake Park, Dallas, TX",
        address: "8300 E Lawther Dr, Dallas, TX 75218",
        description: "Areas affected by agricultural chemical runoff requiring mitigation.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-97.5, 33.0],
          [-96.5, 33.0],
          [-96.5, 32.0],
          [-97.5, 32.0],
          [-97.5, 33.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Montana Mining Reclamation",
        type: "Soil Contamination",
        priority: "low",
        date: "2025-08-22",
        time: "9:00 AM - 4:00 PM",
        location: "Glacier National Park, Montana",
        address: "64 Grinnell Dr, West Glacier, MT 59936",
        description: "Former mining sites requiring soil remediation and native plant restoration.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0, 46.5],
          [-111.0, 46.5],
          [-111.0, 46.0],
          [-112.0, 46.0],
          [-112.0, 46.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "New York Urban Waterway",
        type: "Mixed Pollution",
        priority: "high",
        date: "2025-07-05",
        time: "8:00 AM - 4:00 PM",
        location: "Brooklyn Bridge Park, New York",
        address: "334 Furman St, Brooklyn, NY 11201",
        description: "Urban waterway requiring cleanup of multiple contaminants from historical industrial use.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-74.0, 40.8],
          [-73.8, 40.8],
          [-73.8, 40.6],
          [-74.0, 40.6],
          [-74.0, 40.8]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Arizona Desert Solar Panel Waste",
        type: "Electronic Waste",
        priority: "medium",
        date: "2025-08-12",
        time: "6:30 AM - 2:30 PM",
        location: "Papago Park, Phoenix, AZ",
        address: "625 N Galvin Pkwy, Phoenix, AZ 85008",
        description: "Improper disposal of solar panel components requiring specialized cleanup.",
        eventType: "cleanup"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0, 33.5],
          [-111.0, 33.5],
          [-111.0, 32.5],
          [-112.0, 32.5],
          [-112.0, 33.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Urban Forest Initiative - Seattle",
        type: "Urban Reforestation",
        priority: "medium",
        date: "2025-07-15",
        time: "10:00 AM - 3:00 PM",
        location: "Discovery Park, Seattle, WA",
        address: "3801 Discovery Park Blvd, Seattle, WA 98199",
        description: "Community tree planting event to increase urban canopy coverage.",
        eventType: "treePlanting",
        trees: 500
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.4, 47.7],
          [-122.2, 47.7],
          [-122.2, 47.5],
          [-122.4, 47.5],
          [-122.4, 47.7]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Portland Green Streets",
        type: "Street Tree Planting",
        priority: "low",
        date: "2025-08-01",
        time: "9:30 AM - 2:30 PM",
        location: "Tom McCall Waterfront Park, Portland, OR",
        address: "98 SW Naito Pkwy, Portland, OR 97204",
        description: "Street tree planting program to improve air quality and reduce urban heat island effect.",
        eventType: "treePlanting",
        trees: 300
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-122.7, 45.6],
          [-122.5, 45.6],
          [-122.5, 45.4],
          [-122.7, 45.4],
          [-122.7, 45.6]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Austin Green Belt Restoration",
        type: "Natural Area Restoration",
        priority: "medium",
        date: "2025-07-20",
        time: "8:00 AM - 1:00 PM",
        location: "Zilker Park, Austin, TX",
        address: "2100 Barton Springs Rd, Austin, TX 78746",
        description: "Native tree planting event to restore natural habitat.",
        eventType: "treePlanting",
        trees: 1000
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-97.8, 30.3],
          [-97.6, 30.3],
          [-97.6, 30.1],
          [-97.8, 30.1],
          [-97.8, 30.3]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Fenway Victory Gardens",
        type: "Community Garden",
        date: "2025-07-01",
        time: "10:00 AM - 4:00 PM",
        location: "Fenway Victory Gardens, Boston, MA",
        address: "Park Dr & Boylston St, Boston, MA 02215",
        description: "Historic community gardens with over 500 plots for local residents.",
        eventType: "garden",
        plots: 500
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.095, 42.345],
          [-71.090, 42.345],
          [-71.090, 42.342],
          [-71.095, 42.342],
          [-71.095, 42.345]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Cambridge Community Garden",
        type: "Community Garden",
        date: "2025-08-01",
        time: "9:00 AM - 3:00 PM",
        location: "Cambridge Community Gardens, Cambridge, MA",
        address: "99 Bishop Allen Dr, Cambridge, MA 02139",
        description: "Urban garden promoting sustainable food production and community engagement.",
        eventType: "garden",
        plots: 150
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.115, 42.375],
          [-71.110, 42.375],
          [-71.110, 42.372],
          [-71.115, 42.372],
          [-71.115, 42.375]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Somerville Growing Center",
        type: "Community Garden",
        date: "2025-07-15",
        time: "11:00 AM - 5:00 PM",
        location: "Somerville Community Growing Center, Somerville, MA",
        address: "22 Vinal Ave, Somerville, MA 02143",
        description: "Educational garden space focusing on sustainable urban agriculture.",
        eventType: "garden",
        plots: 75
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-71.098, 42.385],
          [-71.095, 42.385],
          [-71.095, 42.383],
          [-71.098, 42.383],
          [-71.098, 42.385]
        ]]
      }
    }
  ]
};