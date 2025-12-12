package com.ajayprem.habittracker.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "friend_request")
public class FriendRequest {

    @EmbeddedId
    private FriendRequestKey id;

    @ManyToOne
    @MapsId("fromUserId")
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne
    @MapsId("toUserId")
    @JoinColumn(name = "to_user_id")
    private User toUser;

    private String status;

    private String createdAt;

}
