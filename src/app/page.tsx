// src/app/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, MapPin, Building2, Search, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chatbot } from "@/components/chatbot";

interface FirmData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  type: string;
  state: string;
  city: string;
}

interface CityGroup {
  [city: string]: {
    [state: string]: FirmData[];
  };
}

export default function Dashboard() {
  const [firmsData, setFirmsData] = useState<FirmData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFirmsData() {
      const response = await fetch('/data/firms.json');
      const data: FirmData[] = await response.json();
      setFirmsData(data);
    }
    fetchFirmsData();
  }, []);

  // Group firms by city then state
  const groupedFirms = useMemo(() => {
    const filtered = firmsData.filter(firm => 
      !searchTerm || 
      firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firm.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, firm) => {
      if (!acc[firm.city]) {
        acc[firm.city] = {};
      }
      if (!acc[firm.city][firm.state]) {
        acc[firm.city][firm.state] = [];
      }
      acc[firm.city][firm.state].push(firm);
      return acc;
    }, {} as CityGroup);
  }, [firmsData, searchTerm]);

  // Sort cities by firm count
  const sortedCities = useMemo(() => {
    return Object.entries(groupedFirms)
      .map(([city, states]) => ({
        city,
        count: Object.values(states).flat().length
      }))
      .sort((a, b) => b.count - a.count);
  }, [groupedFirms]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by firm name or ID..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Chatbot */}
      <Chatbot />

      {/* Cities Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCities.map(({ city, count }) => (
          <Card key={city} className={cn(
            "transition-colors cursor-pointer",
            expandedCity === city ? "border-primary" : "hover:border-primary/50"
          )}>
            <CardHeader
              className="space-y-1"
              onClick={() => setExpandedCity(city === expandedCity ? null : city)}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg line-clamp-1">{city}</CardTitle>
                <span className="text-sm text-muted-foreground">{count} firms</span>
              </div>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {Object.keys(groupedFirms[city]).length} areas
              </CardDescription>
            </CardHeader>

            {expandedCity === city && (
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(groupedFirms[city]).map(([state, firms]) => (
                    <div key={state} className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-between font-normal"
                        onClick={() => setExpandedState(state === expandedState ? null : state)}
                      >
                        <span className="line-clamp-1">{state}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {firms.length} firms
                          </span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            expandedState === state && "rotate-180"
                          )} />
                        </div>
                      </Button>

                      {expandedState === state && (
                        <div className="pl-4 space-y-2">
                          {firms.map(firm => (
                            <div 
                              key={firm.id}
                              className="space-y-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => setExpandedFirm(firm.id === expandedFirm ? null : firm.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{firm.name}</h4>
                                  <p className="text-sm text-muted-foreground">{firm.id}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                                  {firm.type}
                                </span>
                              </div>

                              {expandedFirm === firm.id && (
                                <div className="text-sm space-y-1.5 pt-2">
                                  <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {firm.address}
                                  </p>
                                  {firm.phone && (
                                    <p className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <a href={`tel:${firm.phone}`} className="hover:text-primary">
                                        {firm.phone}
                                      </a>
                                    </p>
                                  )}
                                  {firm.email && (
                                    <p className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <a href={`mailto:${firm.email}`} className="hover:text-primary">
                                        {firm.email}
                                      </a>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}