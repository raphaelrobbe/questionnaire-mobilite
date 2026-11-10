import {
  MAX_VEHICLES,
  MOTOR_OPTIONS,
  addVehicle,
  changeVehicle,
  removeVehicle,
  type Vehicle,
} from '~/common/survey'
import { Button } from './Button'
import { choiceClass } from './fill'
import { Reveal } from './Reveal'

export function VehiclesStep({
  cars,
  twoWheelers,
  onCars,
  onTwoWheelers,
}: {
  cars: Vehicle[]
  twoWheelers: Vehicle[]
  onCars: (vehicles: Vehicle[]) => void
  onTwoWheelers: (vehicles: Vehicle[]) => void
}) {
  return (
    <div className="mt-6 grid gap-4">
      <section className="grid gap-3">
        <h2 className="text-lg font-extrabold">Voitures</h2>
        {cars.map((vehicle, index) => (
          <Reveal key={`car-${index}`}>
            <VehicleCard
              title={`Voiture ${index + 1}`}
              vehicle={vehicle}
              onChange={(patch) => onCars(changeVehicle(cars, index, patch))}
              onRemove={() => onCars(removeVehicle(cars, index))}
            />
          </Reveal>
        ))}
        <Button variant="secondary" disabled={cars.length >= MAX_VEHICLES} onClick={() => onCars(addVehicle(cars))}>
          Ajouter une voiture
        </Button>
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-extrabold">2/3 roues motorisés</h2>
        {twoWheelers.map((vehicle, index) => (
          <Reveal key={`wheel-${index}`}>
            <VehicleCard
              title={`2/3 roues ${index + 1}`}
              vehicle={vehicle}
              onChange={(patch) => onTwoWheelers(changeVehicle(twoWheelers, index, patch))}
              onRemove={() => onTwoWheelers(removeVehicle(twoWheelers, index))}
            />
          </Reveal>
        ))}
        <Button variant="secondary" disabled={twoWheelers.length >= MAX_VEHICLES} onClick={() => onTwoWheelers(addVehicle(twoWheelers))}>
          Ajouter un 2/3 roues
        </Button>
      </section>
    </div>
  )
}

function VehicleCard({
  title,
  vehicle,
  onChange,
  onRemove,
}: {
  title: string
  vehicle: Vehicle
  onChange: (patch: Partial<Vehicle>) => void
  onRemove: () => void
}) {
  return (
    <fieldset className="grid gap-3 rounded-[28px] border border-line bg-card px-4 py-4">
      <legend className="px-1 font-extrabold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {MOTOR_OPTIONS.map((option) => {
          const selected = vehicle.motor === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ motor: option.value })}
              className={`min-h-11 rounded-full px-3 text-sm font-bold ${choiceClass(selected, 'one', Boolean(vehicle.motor))}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <label className="flex min-h-11 items-center gap-3 font-bold">
        <input
          type="checkbox"
          checked={vehicle.sansPermis}
          onChange={(event) => onChange({ sansPermis: event.target.checked })}
          className="size-5 accent-pine"
        />
        Sans permis
      </label>
      <Button variant="ghost" className="w-auto justify-self-start px-0" onClick={onRemove}>
        Retirer
      </Button>
    </fieldset>
  )
}
