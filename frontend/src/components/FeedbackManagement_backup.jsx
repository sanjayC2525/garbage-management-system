<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openReplyModal(item)}
                        className="text-primary hover:text-primary/80 mr-3"
                      >
                        Reply
                      </button>
                      {item.adminReply && (
                        <span className="text-status-success text-xs">Replied</span>
                      )}
                    </td>
