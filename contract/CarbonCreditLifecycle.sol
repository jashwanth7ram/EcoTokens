// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * This single contract manages the entire lifecycle of a carbon credit.
 * 1.  Role-based Access Control (Admin, Originator, Auditor)
 * 2.  Token (ERC20): The carbon credit token itself.
 * 3.  Project Submission: Originators ("miners") submit projects.
 * 4.  Project Auditing: Auditors approve projects, which mints the tokens.
 * 5.  Marketplace: Holders can list tokens for sale, and others can buy them with ETH.
 *
 * This contract uses OpenZeppelin libraries, which are imported via URL.
 * This makes it easy to compile directly in Remix IDE (https://remix.ethereum.org/).
 *
 * --- V2 Update ---
 * - Removed Counters.sol dependency to fix potential import errors in Remix.
 * - Replaced Counters with standard uint256 variables for project and listing IDs.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// Removed: import "@openzeppelin/contracts/utils/Counters.sol";

contract CarbonCreditLifecycle is ERC20, AccessControl {
    // --- Roles ---
    bytes32 public constant ORIGINATOR_ROLE = keccak256("ORIGINATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // --- Counters ---
    // Replaced OpenZeppelin Counters with standard uint256
    uint256 private _projectIds;
    uint256 private _listingIds;
    uint256 public totalRetired;

    // --- Data Structures ---
    struct Project {
        uint256 id;
        address originator; // The "miner" who submitted the project
        string description;
        uint256 tonnesOfCO2; // Amount of tokens to be minted
        bool isApproved;
        bool isPending;
    }

    struct Listing {
        uint256 id;
        address seller;
        uint256 amount; // Amount of CCT tokens (in wei, i.e., with 18 decimals)
        uint256 priceInWei; // Price in SepoliaETH (in wei)
        bool isActive;
    }

    // --- Mappings ---
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Listing) public listings;

    // --- Events ---
    event ProjectSubmitted(uint256 indexed projectId, address indexed originator, uint256 tonnes);
    event ProjectApproved(uint256 indexed projectId, address indexed auditor, uint256 amountMinted);
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event CreditRetired(address indexed retirer, uint256 amount, string purpose);

    // --- Constructor ---
    constructor() ERC20("Carbon Credit Token", "CCT") {
        // The deployer of the contract gets the Admin role.
        // Admin can grant Originator and Auditor roles.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Role Management (Admin Functions) ---
    function grantOriginatorRole(address _originator) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ORIGINATOR_ROLE, _originator);
    }

    function grantAuditorRole(address _auditor) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, _auditor);
    }

    // --- Carbon Credit Workflow ---

    /**
     * @notice Submitted by an Originator ("miner") to request carbon credits.
     * @param _description A description of the project (e.g., "Reforestation project in Region X").
     * @param _tonnes The number of CO2 tonnes to be offset (1 tonne = 1 CCT token).
     */
    function submitProject(string memory _description, uint256 _tonnes) public onlyRole(ORIGINATOR_ROLE) {
        require(_tonnes > 0, "Tonnes must be greater than zero");

        _projectIds++; // Replaced Counter increment
        uint256 newProjectId = _projectIds; // Replaced Counter current()

        projects[newProjectId] = Project({
            id: newProjectId,
            originator: msg.sender,
            description: _description,
            tonnesOfCO2: _tonnes,
            isApproved: false,
            isPending: true
        });

        emit ProjectSubmitted(newProjectId, msg.sender, _tonnes);
    }

    /**
     * @notice Approved by an Auditor. This mints the tokens to the Originator.
     * @param _projectId The ID of the project to approve.
     */
    function approveProject(uint256 _projectId) public onlyRole(AUDITOR_ROLE) {
        Project storage project = projects[_projectId];
        require(project.id != 0, "Project does not exist");
        require(project.isPending, "Project is not pending approval");
        require(_projectId <= _projectIds, "Project ID out of bounds"); // Added safety check

        project.isApproved = true;
        project.isPending = false;

        // Mint the tokens. 1 token = 1 tonne.
        // ERC20 tokens have 18 decimals, so we multiply by 10**18.
        uint256 amountToMint = project.tonnesOfCO2 * (10**decimals());
        _mint(project.originator, amountToMint);

        emit ProjectApproved(_projectId, msg.sender, amountToMint);
    }

    // --- Marketplace ---

    /**
     * @notice List CCT tokens for sale in exchange for ETH.
     * @dev The seller must first call `approve()` on the CCT token,
     * approving this contract to spend their tokens.
     * @param _amount The amount of CCT tokens to sell (e.g., 100).
     * @param _priceInWei The price *in WEI* for the total amount (e.g., 100000000000000000).
     */
    function listTokens(uint256 _amount, uint256 _priceInWei) public {
        require(_amount > 0, "Amount must be > 0");
        require(_priceInWei > 0, "Price must be > 0");

        uint256 amountInWei = _amount * (10**decimals());

        require(balanceOf(msg.sender) >= amountInWei, "Insufficient CCT balance");
        
        // Transfer the tokens from the seller into this contract for escrow directly
        // Because this IS the ERC20 contract, we can just use the internal _transfer
        _transfer(msg.sender, address(this), amountInWei);

        _listingIds++; // Replaced Counter increment
        uint256 newListingId = _listingIds; // Replaced Counter current()

        listings[newListingId] = Listing({
            id: newListingId,
            seller: msg.sender,
            amount: amountInWei,
            priceInWei: _priceInWei, // Use the provided _priceInWei directly
            isActive: true
        });

        emit ListingCreated(newListingId, msg.sender, amountInWei, _priceInWei);
    }

    /**
     * @notice Buy CCT tokens that are listed on the marketplace.
     * @dev The buyer must send the exact amount of ETH (in wei) as `msg.value`.
     * @param _listingId The ID of the listing to purchase.
     */
    function buyTokens(uint256 _listingId) public payable {
        Listing storage listing = listings[_listingId];
        require(listing.id != 0, "Listing does not exist");
        require(listing.isActive, "Listing is not active");
        require(msg.value == listing.priceInWei, "Incorrect ETH amount sent");
        require(listing.seller != msg.sender, "Seller cannot buy their own listing");
        require(_listingId <= _listingIds, "Listing ID out of bounds"); // Added safety check

        listing.isActive = false;

        // 1. Send the ETH (SepoliaETH) to the seller
        (bool sent, ) = listing.seller.call{value: listing.priceInWei}("");
        require(sent, "Failed to send ETH to seller");

        // 2. Send the CCT tokens (from contract escrow) to the buyer
        // Correctly transfer from escrow address(this) to the buyer
        _transfer(address(this), msg.sender, listing.amount);

        emit ListingSold(_listingId, msg.sender, listing.amount, listing.priceInWei);
    }

    /**
     * @notice Cancel an active listing and retrieve escrowed tokens.
     * @param _listingId The ID of the listing to cancel.
     */
    function cancelListing(uint256 _listingId) public {
        Listing storage listing = listings[_listingId];
        require(listing.id != 0, "Listing does not exist");
        require(listing.isActive, "Listing is not active");
        require(listing.seller == msg.sender, "Only the seller can cancel");
        require(_listingId <= _listingIds, "Listing ID out of bounds"); // Added safety check

        listing.isActive = false;

        // Return the escrowed tokens to the seller from the contract directly
        _transfer(address(this), listing.seller, listing.amount);

        emit ListingCancelled(_listingId, listing.seller);
    }

    // --- View Functions (for Frontend) ---

    /**
     * @notice Get all project IDs that are pending approval.
     */
    function getPendingProjects() public view returns (uint256[] memory) {
        uint256 totalProjects = _projectIds; // Replaced Counter current()
        uint256 pendingCount = 0;
        
        // First, count them
        for (uint256 i = 1; i <= totalProjects; i++) {
            if (projects[i].isPending) {
                pendingCount++;
            }
        }

        // Now, build the array
        uint256[] memory pending = new uint256[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalProjects; i++) {
            if (projects[i].isPending) {
                pending[index] = i;
                index++;
            }
        }
        return pending;
    }

    /**
     * @notice Get all listing IDs that are active.
     */
    function getActiveListings() public view returns (uint256[] memory) {
        uint256 totalListings = _listingIds; // Replaced Counter current()
        uint256 activeCount = 0;

        // First, count them
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }

        // Now, build the array
        uint256[] memory active = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                active[index] = i;
                index++;
            }
        }
        return active;
    }

    /**
     * @notice Permanently burn CCT tokens to offset CO2. Irreversible.
     * @param _amount Whole number of CCT tokens to retire.
     * @param _purpose Reason for retirement (e.g. company name / offset reason).
     */
    function retireCredits(uint256 _amount, string memory _purpose) public {
        require(_amount > 0, "Amount must be greater than zero");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        uint256 amountInWei = _amount * (10**decimals());
        require(balanceOf(msg.sender) >= amountInWei, "Insufficient CCT balance");
        _burn(msg.sender, amountInWei);
        totalRetired += amountInWei;
        emit CreditRetired(msg.sender, amountInWei, _purpose);
    }

    /**
     * @notice Returns key protocol-wide statistics in one call.
     */
    function getStats() public view returns (
        uint256 _totalSupply,
        uint256 _totalRetired,
        uint256 _totalProjects,
        uint256 _totalListings
    ) {
        return (totalSupply(), totalRetired, _projectIds, _listingIds);
    }
}

