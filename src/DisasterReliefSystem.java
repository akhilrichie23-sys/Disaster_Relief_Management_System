import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ============================================================================
 * PROJECT: DISASTER RELIEF MANAGEMENT SYSTEM (DRMS)
 * Course: Java Programming & Object-Oriented Software Engineering
 * Author: Ready-to-Submit Academic Project Implementation
 * ============================================================================
 */

// ==========================================
// 1. ENUMS FOR SYSTEM DOMAIN
// ==========================================

enum DisasterType {
    FLOOD, EARTHQUAKE, CYCLONE, WILDFIRE, TSUNAMI, LANDSLIDE, OTHER
}

enum SeverityLevel {
    LOW, MEDIUM, HIGH, CRITICAL
}

enum IncidentStatus {
    ACTIVE, UNDER_CONTROL, RESOLVED
}

enum MedicalCondition {
    CRITICAL, INJURED, STABLE
}

enum SupplyCategory {
    FOOD_RATIONS, DRINKING_WATER, MEDICAL_KITS, TENTS_BLANKETS, HYGIENE_KITS
}

enum VolunteerSkill {
    SEARCH_AND_RESCUE, MEDICAL_FIRST_RESPONDER, LOGISTICS_SUPPLY, FOOD_DISTRIBUTION, PSYCHOSOCIAL_SUPPORT
}

// ==========================================
// 2. MODEL CLASSES
// ==========================================

/**
 * Represents a Disaster Incident / Affected Zone
 */
class Incident {
    private String id;
    private DisasterType type;
    private String location;
    private SeverityLevel severity;
    private IncidentStatus status;
    private String reportedTime;
    private int estimatedAffectedPeople;

    public Incident(String id, DisasterType type, String location, SeverityLevel severity, int estimatedAffectedPeople) {
        this.id = id;
        this.type = type;
        this.location = location;
        this.severity = severity;
        this.status = IncidentStatus.ACTIVE;
        this.estimatedAffectedPeople = estimatedAffectedPeople;
        this.reportedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getId() { return id; }
    public DisasterType getType() { return type; }
    public String getLocation() { return location; }
    public SeverityLevel getSeverity() { return severity; }
    public IncidentStatus getStatus() { return status; }
    public void setStatus(IncidentStatus status) { this.status = status; }
    public int getEstimatedAffectedPeople() { return estimatedAffectedPeople; }
    public String getReportedTime() { return reportedTime; }

    @Override
    public String toString() {
        return String.format("[%s] %-12s | Loc: %-15s | Severity: %-8s | Status: %-13s | Affected: %d | Time: %s",
                id, type, location, severity, status, estimatedAffectedPeople, reportedTime);
    }
}

/**
 * Represents a Relief Camp / Shelter
 */
class ReliefCamp {
    private String campId;
    private String name;
    private String location;
    private int capacity;
    private int currentOccupancy;
    private String coordinatorName;
    private String contactNumber;

    public ReliefCamp(String campId, String name, String location, int capacity, String coordinatorName, String contactNumber) {
        this.campId = campId;
        this.name = name;
        this.location = location;
        this.capacity = capacity;
        this.currentOccupancy = 0;
        this.coordinatorName = coordinatorName;
        this.contactNumber = contactNumber;
    }

    public String getCampId() { return campId; }
    public String getName() { return name; }
    public String getLocation() { return location; }
    public int getCapacity() { return capacity; }
    public int getCurrentOccupancy() { return currentOccupancy; }
    public String getCoordinatorName() { return coordinatorName; }
    public String getContactNumber() { return contactNumber; }

    public boolean canAccommodate(int count) {
        return (currentOccupancy + count) <= capacity;
    }

    public boolean admitVictims(int count) {
        if (canAccommodate(count)) {
            currentOccupancy += count;
            return true;
        }
        return false;
    }

    public void dischargeVictims(int count) {
        currentOccupancy = Math.max(0, currentOccupancy - count);
    }

    public int getAvailableSpace() {
        return capacity - currentOccupancy;
    }

    @Override
    public String toString() {
        double occupancyRate = ((double) currentOccupancy / capacity) * 100;
        return String.format("[%s] %-20s | Loc: %-14s | Occ: %3d/%-3d (%.1f%%) | Head: %-12s | Ph: %s",
                campId, name, location, currentOccupancy, capacity, occupancyRate, coordinatorName, contactNumber);
    }
}

/**
 * Represents a Registered Victim / Evacuee
 */
class Victim {
    private String victimId;
    private String fullName;
    private int age;
    private String gender;
    private MedicalCondition condition;
    private String assignedCampId;
    private String contactOrKin;
    private String registeredDate;

    public Victim(String victimId, String fullName, int age, String gender, MedicalCondition condition, String assignedCampId, String contactOrKin) {
        this.victimId = victimId;
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.condition = condition;
        this.assignedCampId = assignedCampId;
        this.contactOrKin = contactOrKin;
        this.registeredDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getVictimId() { return victimId; }
    public String getFullName() { return fullName; }
    public int getAge() { return age; }
    public String getGender() { return gender; }
    public MedicalCondition getCondition() { return condition; }
    public void setCondition(MedicalCondition condition) { this.condition = condition; }
    public String getAssignedCampId() { return assignedCampId; }
    public void setAssignedCampId(String assignedCampId) { this.assignedCampId = assignedCampId; }
    public String getContactOrKin() { return contactOrKin; }
    public String getRegisteredDate() { return registeredDate; }

    @Override
    public String toString() {
        return String.format("[%s] %-18s | Age: %2d | %-6s | Med: %-8s | Camp: %-7s | Kin/Ph: %-12s",
                victimId, fullName, age, gender, condition, (assignedCampId == null ? "None" : assignedCampId), contactOrKin);
    }
}

/**
 * Represents Relief Inventory Item (Food, Water, Medical kits, etc.)
 */
class ReliefSupply {
    private SupplyCategory category;
    private String itemName;
    private String unit;
    private int quantity;
    private int minThreshold;

    public ReliefSupply(SupplyCategory category, String itemName, String unit, int initialQuantity, int minThreshold) {
        this.category = category;
        this.itemName = itemName;
        this.unit = unit;
        this.quantity = initialQuantity;
        this.minThreshold = minThreshold;
    }

    public SupplyCategory getCategory() { return category; }
    public String getItemName() { return itemName; }
    public String getUnit() { return unit; }
    public int getQuantity() { return quantity; }

    public void addStock(int qty) {
        this.quantity += qty;
    }

    public boolean dispatchStock(int qty) {
        if (qty <= quantity) {
            quantity -= qty;
            return true;
        }
        return false;
    }

    public boolean isLowStock() {
        return quantity <= minThreshold;
    }

    @Override
    public String toString() {
        String alert = isLowStock() ? " [LOW STOCK ALERT!]" : "";
        return String.format("%-18s | %-22s | Qty: %5d %-6s | Threshold: %4d%s",
                category, itemName, quantity, unit, minThreshold, alert);
    }
}

/**
 * Represents Volunteer / Rescue Personnel
 */
class Volunteer {
    private String volunteerId;
    private String name;
    private VolunteerSkill skill;
    private String contact;
    private boolean isAvailable;
    private String assignedLocation;

    public Volunteer(String volunteerId, String name, VolunteerSkill skill, String contact) {
        this.volunteerId = volunteerId;
        this.name = name;
        this.skill = skill;
        this.contact = contact;
        this.isAvailable = true;
        this.assignedLocation = "Base HQ";
    }

    public String getVolunteerId() { return volunteerId; }
    public String getName() { return name; }
    public VolunteerSkill getSkill() { return skill; }
    public String getContact() { return contact; }
    public boolean isAvailable() { return isAvailable; }
    public String getAssignedLocation() { return assignedLocation; }

    public void assignDuty(String location) {
        this.isAvailable = false;
        this.assignedLocation = location;
    }

    public void releaseDuty() {
        this.isAvailable = true;
        this.assignedLocation = "Base HQ";
    }

    @Override
    public String toString() {
        String statusStr = isAvailable ? "Available" : "Deployed (" + assignedLocation + ")";
        return String.format("[%s] %-18s | Skill: %-25s | Status: %-25s | Ph: %s",
                volunteerId, name, skill, statusStr, contact);
    }
}

/**
 * Represents Financial or In-Kind Aid Donations
 */
class Donation {
    private String donationId;
    private String donorName;
    private double amount;
    private String remarks;
    private String date;

    public Donation(String donationId, String donorName, double amount, String remarks) {
        this.donationId = donationId;
        this.donorName = donorName;
        this.amount = amount;
        this.remarks = remarks;
        this.date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getDonationId() { return donationId; }
    public String getDonorName() { return donorName; }
    public double getAmount() { return amount; }
    public String getRemarks() { return remarks; }
    public String getDate() { return date; }

    @Override
    public String toString() {
        return String.format("[%s] %-20s | Amount: $%,10.2f | Purpose: %-20s | Date: %s",
                donationId, donorName, amount, remarks, date);
    }
}

/**
 * Represents an Emergency SOS Request
 */
class EmergencySOS {
    private String requestId;
    private String location;
    private String callerName;
    private String contact;
    private int peopleTrapped;
    private SeverityLevel urgency;
    private String description;
    private boolean isResolved;
    private String timestamp;

    public EmergencySOS(String requestId, String location, String callerName, String contact, int peopleTrapped, SeverityLevel urgency, String description) {
        this.requestId = requestId;
        this.location = location;
        this.callerName = callerName;
        this.contact = contact;
        this.peopleTrapped = peopleTrapped;
        this.urgency = urgency;
        this.description = description;
        this.isResolved = false;
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public String getRequestId() { return requestId; }
    public String getLocation() { return location; }
    public String getCallerName() { return callerName; }
    public String getContact() { return contact; }
    public int getPeopleTrapped() { return peopleTrapped; }
    public SeverityLevel getUrgency() { return urgency; }
    public String getDescription() { return description; }
    public boolean isResolved() { return isResolved; }
    public void setResolved(boolean resolved) { isResolved = resolved; }
    public String getTimestamp() { return timestamp; }

    @Override
    public String toString() {
        return String.format("[%s] Urgency: %-8s | Loc: %-15s | Trapped: %2d | Caller: %-12s | Ph: %-10s | Status: %s\n       Details: %s (%s)",
                requestId, urgency, location, peopleTrapped, callerName, contact, (isResolved ? "RESOLVED" : "PENDING RESCUE"), description, timestamp);
    }
}

// ==========================================
// 3. SERVICE / CONTROLLER LAYER
// ==========================================

class DisasterReliefService {
    private Map<String, Incident> incidents = new LinkedHashMap<>();
    private Map<String, ReliefCamp> camps = new LinkedHashMap<>();
    private Map<String, Victim> victims = new LinkedHashMap<>();
    private Map<String, ReliefSupply> supplies = new LinkedHashMap<>();
    private Map<String, Volunteer> volunteers = new LinkedHashMap<>();
    private List<Donation> donations = new ArrayList<>();
    private List<EmergencySOS> emergencySOSList = new ArrayList<>();

    private int incidentCounter = 101;
    private int campCounter = 201;
    private int victimCounter = 301;
    private int volunteerCounter = 401;
    private int donationCounter = 501;
    private int sosCounter = 601;

    public DisasterReliefService() {
        seedInitialData();
    }

    private void seedInitialData() {
        // Seed Incidents
        registerIncident(DisasterType.FLOOD, "River Valley, Sector 4", SeverityLevel.CRITICAL, 1200);
        registerIncident(DisasterType.EARTHQUAKE, "North Ridge Zone", SeverityLevel.HIGH, 850);
        registerIncident(DisasterType.LANDSLIDE, "Hilltop Pass Road", SeverityLevel.MEDIUM, 150);

        // Seed Relief Camps
        addReliefCamp("City Civic Arena Shelter", "Downtown Sector 1", 500, "Col. Robert Vance", "9876543210");
        addReliefCamp("St. Jude Community Hall", "North Ridge Suburb", 300, "Dr. Sarah Jenkins", "9876543211");
        addReliefCamp("Govt High School Grounds", "Eastern Safe Zone", 450, "Mark Sullivan", "9876543212");

        // Seed Supplies
        supplies.put("FOOD-1", new ReliefSupply(SupplyCategory.FOOD_RATIONS, "Ready-to-Eat Food Packs", "Units", 1500, 300));
        supplies.put("WATER-1", new ReliefSupply(SupplyCategory.DRINKING_WATER, "Bottled Mineral Water 5L", "Bottles", 2200, 500));
        supplies.put("MED-1", new ReliefSupply(SupplyCategory.MEDICAL_KITS, "Emergency Trauma & First Aid", "Kits", 450, 100));
        supplies.put("TENT-1", new ReliefSupply(SupplyCategory.TENTS_BLANKETS, "Thermal Blankets & Tents", "Sets", 800, 150));
        supplies.put("HYG-1", new ReliefSupply(SupplyCategory.HYGIENE_KITS, "Sanitation & Hygiene Packs", "Packs", 600, 120));

        // Seed Volunteers
        registerVolunteer("Capt. David Miller", VolunteerSkill.SEARCH_AND_RESCUE, "9811223344");
        registerVolunteer("Dr. Emily Watson", VolunteerSkill.MEDICAL_FIRST_RESPONDER, "9822334455");
        registerVolunteer("Carlos Rivera", VolunteerSkill.LOGISTICS_SUPPLY, "9833445566");
        registerVolunteer("Aisha Khan", VolunteerSkill.FOOD_DISTRIBUTION, "9844556677");
        registerVolunteer("Nisha Sharma", VolunteerSkill.PSYCHOSOCIAL_SUPPORT, "9855667788");

        // Seed Victims
        registerVictim("John Anderson", 42, "Male", MedicalCondition.STABLE, "CAMP-201", "9123456780");
        registerVictim("Maria Gonzalez", 28, "Female", MedicalCondition.INJURED, "CAMP-201", "9123456781");
        registerVictim("Grandpa Arthur", 76, "Male", MedicalCondition.CRITICAL, "CAMP-202", "9123456782");
        registerVictim("Little Maya", 8, "Female", MedicalCondition.STABLE, "CAMP-203", "9123456783");

        // Seed Donations
        recordDonation("Global Relief Foundation", 50000.00, "Medical and food aids");
        recordDonation("Red Cross Partner Initiative", 25000.00, "Emergency shelter logistics");
        recordDonation("Anonymous Citizen", 1500.00, "General relief fund");

        // Seed SOS
        registerSOS("Sector 4 Bridge East", "Samuel Green", "9870001111", 5, SeverityLevel.CRITICAL, "Rising flood water reaching roof tops");
    }

    // --- INCIDENT OPERATIONS ---
    public Incident registerIncident(DisasterType type, String location, SeverityLevel severity, int affected) {
        String id = "INC-" + (incidentCounter++);
        Incident inc = new Incident(id, type, location, severity, affected);
        incidents.put(id, inc);
        return inc;
    }

    public List<Incident> getAllIncidents() {
        return new ArrayList<>(incidents.values());
    }

    public Incident getIncident(String id) {
        return incidents.get(id);
    }

    public boolean updateIncidentStatus(String id, IncidentStatus status) {
        Incident inc = incidents.get(id);
        if (inc != null) {
            inc.setStatus(status);
            return true;
        }
        return false;
    }

    // --- RELIEF CAMP OPERATIONS ---
    public ReliefCamp addReliefCamp(String name, String location, int capacity, String coordinator, String phone) {
        String id = "CAMP-" + (campCounter++);
        ReliefCamp camp = new ReliefCamp(id, name, location, capacity, coordinator, phone);
        camps.put(id, camp);
        return camp;
    }

    public List<ReliefCamp> getAllCamps() {
        return new ArrayList<>(camps.values());
    }

    public ReliefCamp getCamp(String id) {
        return camps.get(id);
    }

    // --- VICTIM REGISTRY OPERATIONS ---
    public Victim registerVictim(String name, int age, String gender, MedicalCondition condition, String campId, String contact) {
        ReliefCamp camp = camps.get(campId);
        if (camp != null && !camp.canAccommodate(1)) {
            return null; // Camp full
        }
        String id = "VIC-" + (victimCounter++);
        Victim victim = new Victim(id, name, age, gender, condition, campId, contact);
        victims.put(id, victim);
        if (camp != null) {
            camp.admitVictims(1);
        }
        return victim;
    }

    public List<Victim> getAllVictims() {
        return new ArrayList<>(victims.values());
    }

    public List<Victim> searchVictimsByName(String query) {
        List<Victim> results = new ArrayList<>();
        for (Victim v : victims.values()) {
            if (v.getFullName().toLowerCase().contains(query.toLowerCase())) {
                results.add(v);
            }
        }
        return results;
    }

    // --- INVENTORY OPERATIONS ---
    public List<ReliefSupply> getAllSupplies() {
        return new ArrayList<>(supplies.values());
    }

    public boolean addSupplyStock(String itemKey, int qty) {
        ReliefSupply supply = supplies.get(itemKey);
        if (supply != null) {
            supply.addStock(qty);
            return true;
        }
        return false;
    }

    public boolean dispatchSupply(String itemKey, int qty, String destinationCampId) {
        ReliefSupply supply = supplies.get(itemKey);
        ReliefCamp camp = camps.get(destinationCampId);
        if (supply != null && camp != null) {
            return supply.dispatchStock(qty);
        }
        return false;
    }

    public Map<String, ReliefSupply> getSuppliesMap() {
        return supplies;
    }

    // --- VOLUNTEER OPERATIONS ---
    public Volunteer registerVolunteer(String name, VolunteerSkill skill, String phone) {
        String id = "VOL-" + (volunteerCounter++);
        Volunteer vol = new Volunteer(id, name, skill, phone);
        volunteers.put(id, vol);
        return vol;
    }

    public List<Volunteer> getAllVolunteers() {
        return new ArrayList<>(volunteers.values());
    }

    public boolean deployVolunteer(String volunteerId, String targetLocation) {
        Volunteer vol = volunteers.get(volunteerId);
        if (vol != null && vol.isAvailable()) {
            vol.assignDuty(targetLocation);
            return true;
        }
        return false;
    }

    public boolean releaseVolunteer(String volunteerId) {
        Volunteer vol = volunteers.get(volunteerId);
        if (vol != null && !vol.isAvailable()) {
            vol.releaseDuty();
            return true;
        }
        return false;
    }

    // --- DONATION OPERATIONS ---
    public Donation recordDonation(String donorName, double amount, String remarks) {
        String id = "DON-" + (donationCounter++);
        Donation d = new Donation(id, donorName, amount, remarks);
        donations.add(d);
        return d;
    }

    public List<Donation> getAllDonations() {
        return donations;
    }

    public double getTotalDonationFunds() {
        double total = 0;
        for (Donation d : donations) {
            total += d.getAmount();
        }
        return total;
    }

    // --- SOS DISPATCH OPERATIONS ---
    public EmergencySOS registerSOS(String location, String caller, String contact, int trapped, SeverityLevel urgency, String details) {
        String id = "SOS-" + (sosCounter++);
        EmergencySOS sos = new EmergencySOS(id, location, caller, contact, trapped, urgency, details);
        emergencySOSList.add(sos);
        return sos;
    }

    public List<EmergencySOS> getAllSOSRequests() {
        return emergencySOSList;
    }

    public boolean resolveSOS(String sosId) {
        for (EmergencySOS s : emergencySOSList) {
            if (s.getRequestId().equalsIgnoreCase(sosId)) {
                s.setResolved(true);
                return true;
            }
        }
        return false;
    }

    // --- OVERALL METRICS ---
    public void printExecutiveDashboard() {
        int totalAffected = 0;
        for (Incident inc : incidents.values()) {
            if (inc.getStatus() != IncidentStatus.RESOLVED) {
                totalAffected += inc.getEstimatedAffectedPeople();
            }
        }

        int totalCampCapacity = 0;
        int totalCampOccupancy = 0;
        for (ReliefCamp c : camps.values()) {
            totalCampCapacity += c.getCapacity();
            totalCampOccupancy += c.getCurrentOccupancy();
        }

        long availableVolunteers = volunteers.values().stream().filter(Volunteer::isAvailable).count();
        long pendingSOS = emergencySOSList.stream().filter(s -> !s.isResolved()).count();

        System.out.println("\n================================================================================");
        System.out.println("            *** DISASTER RELIEF EXECUTIVE COMMAND DASHBOARD ***                 ");
        System.out.println("================================================================================");
        System.out.printf("  Active / Monitored Incidents    : %-5d | Est. People in Impact Zone : %d\n", incidents.size(), totalAffected);
        System.out.printf("  Shelters & Relief Camps Active  : %-5d | Total Camp Capacity / Occ  : %d / %d (%.1f%%)\n",
                camps.size(), totalCampOccupancy, totalCampCapacity, totalCampCapacity == 0 ? 0 : ((double) totalCampOccupancy / totalCampCapacity * 100));
        System.out.printf("  Registered Rescued Evacuees     : %-5d | Critical Medical Patients   : %d\n",
                victims.size(), victims.values().stream().filter(v -> v.getCondition() == MedicalCondition.CRITICAL).count());
        System.out.printf("  Total Volunteers Ready / Active : %-5d (Available: %d | Deployed: %d)\n",
                volunteers.size(), availableVolunteers, volunteers.size() - availableVolunteers);
        System.out.printf("  Pending SOS Emergency Rescues   : %-5d | Total Relief Aid Raised     : $%,.2f\n",
                pendingSOS, getTotalDonationFunds());
        System.out.println("================================================================================\n");
    }
}

// ==========================================
// 4. PRESENTATION & CONSOLE UI LAYER
// ==========================================

public class DisasterReliefSystem {

    private static final Scanner scanner = new Scanner(System.in);
    private static final DisasterReliefService service = new DisasterReliefService();

    public static void main(String[] args) {
        printBanner();
        boolean running = true;

        while (running) {
            printMainMenu();
            System.out.print("Select an Option [1-9]: ");
            String input = scanner.nextLine().trim();

            switch (input) {
                case "1":
                    handleDashboard();
                    break;
                case "2":
                    handleIncidentManagement();
                    break;
                case "3":
                    handleReliefCampManagement();
                    break;
                case "4":
                    handleVictimManagement();
                    break;
                case "5":
                    handleInventoryManagement();
                    break;
                case "6":
                    handleVolunteerManagement();
                    break;
                case "7":
                    handleSOSOperations();
                    break;
                case "8":
                    handleDonations();
                    break;
                case "9":
                    System.out.println("\n[INFO] Shutting down Disaster Relief Command System. Stay safe!");
                    running = false;
                    break;
                default:
                    System.out.println("\n[!] Invalid selection. Please choose an option between 1 and 9.");
            }
        }
        scanner.close();
    }

    private static void printBanner() {
        System.out.println("\n================================================================================");
        System.out.println("      ____  _                 _              ____      _ _       __ ");
        System.out.println("     |  _ \\(_)___  __ _  ___| |_ ___ _ __   |  _ \\ ___| (_) ___ / _|");
        System.out.println("     | | | | / __|/ _` |/ __| __/ _ \\ '__|  | |_) / _ \\ | |/ _ \\ |_ ");
        System.out.println("     | |_| | \\__ \\ (_| | (__| ||  __/ |     |  _ <  __/ | |  __/  _|");
        System.out.println("     |____/|_|___/\\__,_|\\___|\\__\\___|_|     |_| \\_\\___|_|_|\\___|_|  ");
        System.out.println("               CENTRALIZED RELIEF & RESCUE MANAGEMENT SYSTEM            ");
        System.out.println("================================================================================");
    }

    private static void printMainMenu() {
        System.out.println("\n----------------- MAIN COMMAND CONSOLE -----------------");
        System.out.println("1. View Executive Command Dashboard");
        System.out.println("2. Disaster Incidents & Zones Management");
        System.out.println("3. Relief Camps & Shelters Management");
        System.out.println("4. Evacuee / Victim Registry & Medical Status");
        System.out.println("5. Relief Inventory & Aid Supply Distribution");
        System.out.println("6. Volunteer & Rescue Teams Management");
        System.out.println("7. Emergency SOS & Distress Call Center");
        System.out.println("8. Aid Donations & Relief Fund Tracker");
        System.out.println("9. Exit System");
        System.out.println("--------------------------------------------------------");
    }

    // 1. DASHBOARD
    private static void handleDashboard() {
        service.printExecutiveDashboard();
    }

    // 2. INCIDENTS
    private static void handleIncidentManagement() {
        System.out.println("\n--- [DISASTER INCIDENT MANAGEMENT] ---");
        System.out.println("1. List All Reported Incidents");
        System.out.println("2. Register New Disaster Incident");
        System.out.println("3. Update Incident Status");
        System.out.println("4. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- LIST OF ACTIVE & RECORDED DISASTERS ---");
                List<Incident> list = service.getAllIncidents();
                if (list.isEmpty()) {
                    System.out.println("No incidents recorded.");
                } else {
                    for (Incident inc : list) {
                        System.out.println(inc);
                    }
                }
                break;
            case "2":
                System.out.println("\n--- REGISTER NEW DISASTER INCIDENT ---");
                System.out.println("Select Type: 1.FLOOD  2.EARTHQUAKE  3.CYCLONE  4.WILDFIRE  5.TSUNAMI  6.LANDSLIDE  7.OTHER");
                System.out.print("Type number: ");
                int t = Integer.parseInt(scanner.nextLine().trim());
                DisasterType type = switch (t) {
                    case 1 -> DisasterType.FLOOD;
                    case 2 -> DisasterType.EARTHQUAKE;
                    case 3 -> DisasterType.CYCLONE;
                    case 4 -> DisasterType.WILDFIRE;
                    case 5 -> DisasterType.TSUNAMI;
                    case 6 -> DisasterType.LANDSLIDE;
                    default -> DisasterType.OTHER;
                };

                System.out.print("Enter Incident Location/Zone: ");
                String loc = scanner.nextLine().trim();

                System.out.println("Select Severity: 1.LOW  2.MEDIUM  3.HIGH  4.CRITICAL");
                System.out.print("Severity number: ");
                int s = Integer.parseInt(scanner.nextLine().trim());
                SeverityLevel sev = switch (s) {
                    case 1 -> SeverityLevel.LOW;
                    case 2 -> SeverityLevel.MEDIUM;
                    case 3 -> SeverityLevel.HIGH;
                    default -> SeverityLevel.CRITICAL;
                };

                System.out.print("Estimated Affected Population: ");
                int aff = Integer.parseInt(scanner.nextLine().trim());

                Incident created = service.registerIncident(type, loc, sev, aff);
                System.out.println("\n[SUCCESS] Incident logged successfully! Assigned ID: " + created.getId());
                break;
            case "3":
                System.out.print("Enter Incident ID to update (e.g. INC-101): ");
                String incId = scanner.nextLine().trim().toUpperCase();
                System.out.println("Select New Status: 1.ACTIVE  2.UNDER_CONTROL  3.RESOLVED");
                System.out.print("Status: ");
                int st = Integer.parseInt(scanner.nextLine().trim());
                IncidentStatus newStatus = switch (st) {
                    case 1 -> IncidentStatus.ACTIVE;
                    case 2 -> IncidentStatus.UNDER_CONTROL;
                    default -> IncidentStatus.RESOLVED;
                };
                if (service.updateIncidentStatus(incId, newStatus)) {
                    System.out.println("[SUCCESS] Incident status updated to: " + newStatus);
                } else {
                    System.out.println("[ERROR] Incident ID not found!");
                }
                break;
            default:
                break;
        }
    }

    // 3. CAMPS
    private static void handleReliefCampManagement() {
        System.out.println("\n--- [RELIEF CAMP & SHELTER MANAGEMENT] ---");
        System.out.println("1. List All Relief Shelters & Occupancy Rates");
        System.out.println("2. Establish New Relief Camp");
        System.out.println("3. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- ACTIVE RELIEF CAMPS & SHELTERS ---");
                List<ReliefCamp> camps = service.getAllCamps();
                for (ReliefCamp c : camps) {
                    System.out.println(c);
                }
                break;
            case "2":
                System.out.println("\n--- ESTABLISH NEW RELIEF CAMP ---");
                System.out.print("Enter Shelter / Camp Name: ");
                String name = scanner.nextLine().trim();
                System.out.print("Enter Location / Sector: ");
                String loc = scanner.nextLine().trim();
                System.out.print("Enter Max Accommodating Capacity: ");
                int cap = Integer.parseInt(scanner.nextLine().trim());
                System.out.print("Enter Lead Officer / Coordinator Name: ");
                String coord = scanner.nextLine().trim();
                System.out.print("Enter Coordinator Emergency Phone: ");
                String ph = scanner.nextLine().trim();

                ReliefCamp created = service.addReliefCamp(name, loc, cap, coord, ph);
                System.out.println("\n[SUCCESS] New Relief Camp registered with ID: " + created.getCampId());
                break;
            default:
                break;
        }
    }

    // 4. VICTIMS
    private static void handleVictimManagement() {
        System.out.println("\n--- [EVACUEE & VICTIM REGISTRY] ---");
        System.out.println("1. View All Registered Evacuees");
        System.out.println("2. Register Rescued Evacuee / Victim");
        System.out.println("3. Search Evacuee by Name (Missing Person Finder)");
        System.out.println("4. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- REGISTERED EVACUEES ---");
                List<Victim> victims = service.getAllVictims();
                for (Victim v : victims) {
                    System.out.println(v);
                }
                break;
            case "2":
                System.out.println("\n--- REGISTER NEW EVACUEE ---");
                System.out.print("Enter Full Name: ");
                String name = scanner.nextLine().trim();
                System.out.print("Enter Age: ");
                int age = Integer.parseInt(scanner.nextLine().trim());
                System.out.print("Enter Gender (Male/Female/Other): ");
                String gen = scanner.nextLine().trim();

                System.out.println("Select Medical Condition: 1.STABLE  2.INJURED  3.CRITICAL");
                System.out.print("Condition: ");
                int c = Integer.parseInt(scanner.nextLine().trim());
                MedicalCondition med = switch (c) {
                    case 1 -> MedicalCondition.STABLE;
                    case 2 -> MedicalCondition.INJURED;
                    default -> MedicalCondition.CRITICAL;
                };

                System.out.println("Available Camps:");
                for (ReliefCamp rc : service.getAllCamps()) {
                    System.out.printf("  %s -> %s (Avail Space: %d)\n", rc.getCampId(), rc.getName(), rc.getAvailableSpace());
                }
                System.out.print("Enter Camp ID to Assign (e.g. CAMP-201): ");
                String campId = scanner.nextLine().trim().toUpperCase();
                System.out.print("Enter Next-of-Kin Contact Phone / Name: ");
                String kin = scanner.nextLine().trim();

                Victim v = service.registerVictim(name, age, gen, med, campId, kin);
                if (v != null) {
                    System.out.println("\n[SUCCESS] Evacuee registered and allocated to camp! Assigned ID: " + v.getVictimId());
                } else {
                    System.out.println("\n[ERROR] Failed to allocate victim: Selected camp is either full or invalid ID!");
                }
                break;
            case "3":
                System.out.print("\nEnter person name keyword to search: ");
                String q = scanner.nextLine().trim();
                List<Victim> matches = service.searchVictimsByName(q);
                if (matches.isEmpty()) {
                    System.out.println("[RESULT] No registered evacuees matched the name: '" + q + "'");
                } else {
                    System.out.println("\n--- MATCHING RESCUED INDIVIDUALS ---");
                    for (Victim m : matches) {
                        System.out.println(m);
                    }
                }
                break;
            default:
                break;
        }
    }

    // 5. INVENTORY
    private static void handleInventoryManagement() {
        System.out.println("\n--- [RELIEF INVENTORY & AID SUPPLIES] ---");
        System.out.println("1. Check Current Warehouse Inventory");
        System.out.println("2. Receive Inbound Stock Batch");
        System.out.println("3. Dispatch Supplies to Relief Camp");
        System.out.println("4. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- RELIEF INVENTORY STOCK LEVEL ---");
                for (Map.Entry<String, ReliefSupply> entry : service.getSuppliesMap().entrySet()) {
                    System.out.printf("[%s] %s\n", entry.getKey(), entry.getValue());
                }
                break;
            case "2":
                System.out.print("Enter Item Key (e.g. FOOD-1, WATER-1, MED-1, TENT-1, HYG-1): ");
                String itemKey = scanner.nextLine().trim().toUpperCase();
                System.out.print("Enter quantity to add: ");
                int qty = Integer.parseInt(scanner.nextLine().trim());
                if (service.addSupplyStock(itemKey, qty)) {
                    System.out.println("[SUCCESS] Stock replenished successfully!");
                } else {
                    System.out.println("[ERROR] Invalid Item Key.");
                }
                break;
            case "3":
                System.out.print("Enter Item Key to Dispatch: ");
                String key = scanner.nextLine().trim().toUpperCase();
                System.out.print("Enter Quantity to Dispatch: ");
                int dQty = Integer.parseInt(scanner.nextLine().trim());
                System.out.print("Enter Target Relief Camp ID (e.g. CAMP-201): ");
                String targetCamp = scanner.nextLine().trim().toUpperCase();

                if (service.dispatchSupply(key, dQty, targetCamp)) {
                    System.out.printf("[SUCCESS] Dispatched %d units of [%s] to Shelter [%s]!\n", dQty, key, targetCamp);
                } else {
                    System.out.println("[ERROR] Dispatch failed. Please check available stock or valid Camp ID.");
                }
                break;
            default:
                break;
        }
    }

    // 6. VOLUNTEERS
    private static void handleVolunteerManagement() {
        System.out.println("\n--- [VOLUNTEER & RESCUE FORCES MANAGEMENT] ---");
        System.out.println("1. List All Volunteers & Deployment Status");
        System.out.println("2. Enlist New Relief Volunteer");
        System.out.println("3. Deploy Volunteer to Field Location");
        System.out.println("4. Recall / Release Volunteer back to Base");
        System.out.println("5. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- VOLUNTEER CORPS ROSTER ---");
                for (Volunteer v : service.getAllVolunteers()) {
                    System.out.println(v);
                }
                break;
            case "2":
                System.out.print("Enter Volunteer Full Name: ");
                String name = scanner.nextLine().trim();
                System.out.println("Select Skill Specialization:");
                System.out.println("1.SEARCH_AND_RESCUE  2.MEDICAL_FIRST_RESPONDER  3.LOGISTICS_SUPPLY  4.FOOD_DISTRIBUTION  5.PSYCHOSOCIAL_SUPPORT");
                System.out.print("Skill: ");
                int sk = Integer.parseInt(scanner.nextLine().trim());
                VolunteerSkill skill = switch (sk) {
                    case 1 -> VolunteerSkill.SEARCH_AND_RESCUE;
                    case 2 -> VolunteerSkill.MEDICAL_FIRST_RESPONDER;
                    case 3 -> VolunteerSkill.LOGISTICS_SUPPLY;
                    case 4 -> VolunteerSkill.FOOD_DISTRIBUTION;
                    default -> VolunteerSkill.PSYCHOSOCIAL_SUPPORT;
                };
                System.out.print("Enter Contact Phone: ");
                String phone = scanner.nextLine().trim();

                Volunteer created = service.registerVolunteer(name, skill, phone);
                System.out.println("\n[SUCCESS] Volunteer enlisted with ID: " + created.getVolunteerId());
                break;
            case "3":
                System.out.print("Enter Volunteer ID to deploy (e.g. VOL-401): ");
                String vid = scanner.nextLine().trim().toUpperCase();
                System.out.print("Enter Destination Sector / Relief Camp: ");
                String dest = scanner.nextLine().trim();
                if (service.deployVolunteer(vid, dest)) {
                    System.out.println("[SUCCESS] Volunteer deployed to " + dest);
                } else {
                    System.out.println("[ERROR] Volunteer ID not found or already deployed.");
                }
                break;
            case "4":
                System.out.print("Enter Volunteer ID to recall: ");
                String rId = scanner.nextLine().trim().toUpperCase();
                if (service.releaseVolunteer(rId)) {
                    System.out.println("[SUCCESS] Volunteer recalled and set to Available status.");
                } else {
                    System.out.println("[ERROR] Volunteer ID not found or already at base.");
                }
                break;
            default:
                break;
        }
    }

    // 7. SOS
    private static void handleSOSOperations() {
        System.out.println("\n--- [EMERGENCY SOS & RESCUE DISPATCH] ---");
        System.out.println("1. View Active SOS Distress Calls");
        System.out.println("2. Log Inbound SOS Call");
        System.out.println("3. Mark SOS as Rescued / Resolved");
        System.out.println("4. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- EMERGENCY SOS DISTRESS CALLS ---");
                List<EmergencySOS> sosList = service.getAllSOSRequests();
                if (sosList.isEmpty()) {
                    System.out.println("No active SOS requests.");
                } else {
                    for (EmergencySOS s : sosList) {
                        System.out.println(s);
                        System.out.println("--------------------------------------------------------------------------------");
                    }
                }
                break;
            case "2":
                System.out.print("Enter Exact Trapped Location / Landmark: ");
                String loc = scanner.nextLine().trim();
                System.out.print("Enter Caller / Reporter Name: ");
                String caller = scanner.nextLine().trim();
                System.out.print("Enter Caller Phone Number: ");
                String phone = scanner.nextLine().trim();
                System.out.print("Number of People Trapped / In Danger: ");
                int trapped = Integer.parseInt(scanner.nextLine().trim());

                System.out.println("Select Urgency: 1.LOW  2.MEDIUM  3.HIGH  4.CRITICAL");
                System.out.print("Urgency: ");
                int u = Integer.parseInt(scanner.nextLine().trim());
                SeverityLevel urg = switch (u) {
                    case 1 -> SeverityLevel.LOW;
                    case 2 -> SeverityLevel.MEDIUM;
                    case 3 -> SeverityLevel.HIGH;
                    default -> SeverityLevel.CRITICAL;
                };

                System.out.print("Emergency Description / Specific Hazard: ");
                String desc = scanner.nextLine().trim();

                EmergencySOS sos = service.registerSOS(loc, caller, phone, trapped, urg, desc);
                System.out.println("\n[ALERT] SOS Logged! ID: " + sos.getRequestId() + " -> Dispatched to First Responder Queue.");
                break;
            case "3":
                System.out.print("Enter SOS Request ID to mark Resolved (e.g. SOS-601): ");
                String sId = scanner.nextLine().trim().toUpperCase();
                if (service.resolveSOS(sId)) {
                    System.out.println("[SUCCESS] SOS Request marked as RESOLVED / RESCUED.");
                } else {
                    System.out.println("[ERROR] SOS ID not found.");
                }
                break;
            default:
                break;
        }
    }

    // 8. DONATIONS
    private static void handleDonations() {
        System.out.println("\n--- [RELIEF AID & DONATION LEDGER] ---");
        System.out.println("1. View All Recorded Contributions");
        System.out.println("2. Record New Monetary Donation");
        System.out.println("3. Back to Main Menu");
        System.out.print("Enter choice: ");
        String ch = scanner.nextLine().trim();

        switch (ch) {
            case "1":
                System.out.println("\n--- DONATION CONTRIBUTION RECORDS ---");
                for (Donation d : service.getAllDonations()) {
                    System.out.println(d);
                }
                System.out.printf("\nTOTAL RELIEF FUNDS ACCUMULATED: $%,.2f\n", service.getTotalDonationFunds());
                break;
            case "2":
                System.out.print("Enter Donor Name / Organization: ");
                String donor = scanner.nextLine().trim();
                System.out.print("Enter Donation Amount ($): ");
                double amt = Double.parseDouble(scanner.nextLine().trim());
                System.out.print("Enter Designated Purpose / Remarks: ");
                String rem = scanner.nextLine().trim();

                Donation don = service.recordDonation(donor, amt, rem);
                System.out.printf("\n[SUCCESS] Donation recorded! ID: %s | Thank you %s!\n", don.getDonationId(), donor);
                break;
            default:
                break;
        }
    }
}
