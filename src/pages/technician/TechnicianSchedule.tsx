import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardCheck, CalendarRange, ListChecks, Building, PenTool as Tool, Info, Clock, AlertTriangle } from 'lucide-react';

const TechnicianSchedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState("calendar"); // "calendar" or "list"
  
  // This would come from a real database in a production app
  const mockInterventions = [
    {
      id: "int1",
      date: new Date(Date.now() + 86400000), // tomorrow
      time: "09:00 - 11:00",
      hotel: "Hôtel Royal Palace",
      location: "Chambre 301",
      type: "Plomberie",
      status: "upcoming",
      description: "Fuite dans la salle de bain"
    },
    {
      id: "int2",
      date: new Date(Date.now() + 172800000), // day after tomorrow
      time: "14:00 - 15:30",
      hotel: "Riviera Luxury Hotel",
      location: "Cuisine principale",
      type: "Électricité",
      status: "upcoming",
      description: "Vérification du tableau électrique"
    },
    {
      id: "int3",
      date: new Date(Date.now() - 86400000), // yesterday
      time: "11:00 - 12:00",
      hotel: "Mountain View Resort",
      location: "Piscine",
      type: "Plomberie",
      status: "completed",
      description: "Réparation tuyauterie"
    }
  ];
  
  // Filter interventions by selected date
  const interventionsForSelectedDate = mockInterventions.filter(intervention => {
    if (!date) return false;
    return intervention.date.toDateString() === date.toDateString();
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planning des Interventions</h1>
          <p className="text-muted-foreground">Consultez vos interventions prévues</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs defaultValue={view} onValueChange={setView} className="w-full sm:w-auto">
            <TabsList className="w-full">
              <TabsTrigger value="calendar" className="flex items-center">
                <CalendarRange className="mr-2 h-4 w-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center">
                <ListChecks className="mr-2 h-4 w-4" />
                Liste
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="plumbing">Plomberie</SelectItem>
              <SelectItem value="electricity">Électricité</SelectItem>
              <SelectItem value="hvac">Climatisation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-8 lg:col-span-9">
          <TabsContent value="calendar" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarRange className="mr-2 h-5 w-5" />
                  Calendrier des interventions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  // Here we would highlight days with scheduled interventions
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" />
                  Liste des interventions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInterventions.map(intervention => (
                    <div 
                      key={intervention.id}
                      className={`p-4 rounded-md border flex items-start space-x-4 ${
                        intervention.status === 'completed' 
                          ? 'bg-gray-50 opacity-70' 
                          : 'bg-white'
                      }`}
                    >
                      <div className="bg-brand-50 text-brand-700 p-3 rounded-md">
                        <Tool className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{intervention.type}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            intervention.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {intervention.status === 'upcoming' ? 'À venir' : 'Terminé'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">{intervention.description}</p>
                        
                        <div className="mt-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Building className="h-3.5 w-3.5 mr-1" />
                            {intervention.hotel} - {intervention.location}
                          </div>
                          <div className="flex items-center text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {intervention.date.toLocaleDateString()} {intervention.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {mockInterventions.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucune intervention programmée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
        
        <div className="col-span-1 md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Interventions du jour</CardTitle>
            </CardHeader>
            <CardContent>
              {date && (
                <div className="text-sm font-medium mb-4">
                  {date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              )}
              
              {interventionsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {interventionsForSelectedDate.map(intervention => (
                    <div 
                      key={intervention.id}
                      className="p-3 border rounded-md bg-cream-50 dark:bg-charcoal-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{intervention.time}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          intervention.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {intervention.status === 'upcoming' ? 'À venir' : 'Terminé'}
                        </span>
                      </div>
                      
                      <div className="mt-1">
                        <div className="flex items-center text-sm">
                          <Tool className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {intervention.type}
                        </div>
                        
                        <div className="flex items-center text-sm mt-1">
                          <Building className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {intervention.hotel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Aucune intervention programmée pour cette date.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardCheck className="mr-2 h-5 w-5" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  Ce planning affiche les interventions acceptées par les clients suite à un devis.
                </p>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    N'oubliez pas de marquer les interventions comme terminées une fois le travail effectué.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TechnicianSchedule;