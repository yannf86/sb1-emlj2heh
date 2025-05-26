const loadData = async () => {
    try {
      setLoading(true);
      
      // Load hotels
      const hotelsData = await getHotels();
      setHotels(hotelsData);
      
      // Load categories
      const categoriesData = await getIncidentCategoryParameters();
      setCategories(categoriesData);
      
      // Load impacts
      const impactsData = await getImpactParameters();
      setImpacts(impactsData);
      
      // Load statuses
      const statusesData = await getStatusParameters();
      setStatuses(statusesData);
      
      // Load booking origins
      const bookingOriginsData = await getBookingOriginParameters();
      setBookingOrigins(bookingOriginsData);
      
      // Load room types
      const roomTypesData = await getRoomTypeParameters();
      setRoomTypes(roomTypesData);
      
      // Load all users initially
      const allUsers = await getUsers();
      setUsers(allUsers);
      
      // Filter users based on selected hotel
      if (incident?.hotelId) {
        const hotelUsers = await getUsersByHotel(incident.hotelId);
        setFilteredUsers(hotelUsers);
      } else {
        setFilteredUsers(allUsers);
      }
      
      // Load locations for the current hotel
      if (incident?.hotelId) {
        const locationsData = await getHotelLocations(incident.hotelId);
        setLocations(locationsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

export default loadData