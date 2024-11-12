// src/components/dashboard/StatisticsCharts.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FirmData {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  type: string;
  state: string;
  city: string;
}

interface StatisticsChartsProps {
  firms: FirmData[];
}

export function StatisticsCharts({ firms }: StatisticsChartsProps) {
  // Prepare data for firms by state
  const firmsByState = firms.reduce((acc: Record<string, number>, firm) => {
    acc[firm.state] = (acc[firm.state] || 0) + 1;
    return acc;
  }, {});

  const stateData = Object.entries(firmsByState)
    .map(([state, count]) => ({ 
      label: state,
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare data for firms by type
  const firmsByType = firms.reduce((acc: Record<string, number>, firm) => {
    acc[firm.type] = (acc[firm.type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(firmsByType)
    .map(([type, count]) => ({ 
      label: type,
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Firms by State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stateData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(item.value / Math.max(...stateData.map(d => d.value))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firms by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {typeData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(item.value / Math.max(...typeData.map(d => d.value))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}