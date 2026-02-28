import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

// No changes needed, no empty migration required
actor {
  type Station = {
    name : Text;
    url : Text;
    country : Text;
    codec : Text;
    bitrate : Nat;
    tags : Text;
    homepage : Text;
    favicon : Text;
    language : Text;
  };

  // Initialize map for storing user favorites
  let favorites = Map.empty<Principal, [Station]>();

  // Add a station to user's favorites
  public shared ({ caller }) func addFavorite(station : Station) : async () {
    let currentFavorites = switch (favorites.get(caller)) {
      case (null) { [] };
      case (?stations) { stations };
    };

    let updatedFavorites = currentFavorites.concat([station]);
    favorites.add(caller, updatedFavorites);
  };

  // Remove a station from user's favorites
  public shared ({ caller }) func removeFavorite(stationName : Text) : async () {
    let currentFavorites = switch (favorites.get(caller)) {
      case (null) { [] };
      case (?stations) { stations };
    };

    let updatedFavorites = currentFavorites.filter(
      func(station) { station.name != stationName }
    );

    favorites.add(caller, updatedFavorites);
  };

  // Get all favorite stations for the current user
  public shared ({ caller }) func getFavorites() : async [Station] {
    switch (favorites.get(caller)) {
      case (null) { [] };
      case (?stations) { stations };
    };
  };
};
