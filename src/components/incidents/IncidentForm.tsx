const [formData, setFormData] = useState<any>(() => {
    if (isEditing && incident) {
      return {
        ...incident,
        photoPreview: incident.photoUrl || ''
      };
    } else {
      return {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hotelId: currentUser?.role === 'standard' && currentUser?.hotels?.length === 1 ? currentUser.hotels[0] : '',
        locationId: '',
        roomType: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        arrivalDate: '',
        departureDate: '',
        reservationAmount: '',
        origin: '',
        categoryId: '',
        impactId: '',
        description: '',
        statusId: '',
        receivedById: currentUser?.id || '',
        concludedById: '',
        resolutionDescription: ''
      };
    }
  });
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [bookingOrigins, setBookingOrigins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);